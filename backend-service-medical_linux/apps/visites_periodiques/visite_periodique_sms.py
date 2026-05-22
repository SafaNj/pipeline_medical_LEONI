"""
SMS TunisieSMS pour les listes de visite périodique (aligné sur contre_visite_sms) :
- Rappel veille (J-1) — tâche planifiée (ex. 12h).
- Notification des 2 premiers de la file — passage SOUMISE → EN_TRAITEMENT (prendre_en_traitement).
- Cascade N+2 — après rattachement de la fiche d’aptitude à une ligne (première fois).

Les erreurs SMS ne bloquent jamais le flux métier (journalisation uniquement).
"""

from __future__ import annotations

import logging
from datetime import timedelta

from django.utils import timezone

from apps.visites_periodiques.models import LigneVisitePeriodique, ListeVisitePeriodique
from apps.planning.sms_service import send_sms

logger = logging.getLogger(__name__)


def _prenom_ou_nom(collab) -> str:
    if not collab:
        return "collaborateur"
    p = (getattr(collab, "prenom", None) or "").strip()
    if p:
        return p[:80]
    n = (getattr(collab, "nom", None) or "").strip()
    if n:
        return n[:80]
    m = getattr(collab, "matricule", None)
    return str(m).strip()[:80] if m else "collaborateur"


def _lignes_file_attente(liste: ListeVisitePeriodique):
    """File : pas encore de fiche d’aptitude, hors absent (ordre création des lignes)."""
    return (
        LigneVisitePeriodique.objects.filter(liste=liste, fiche_aptitude__isnull=True)
        .exclude(presence=LigneVisitePeriodique.PRESENCE_ABSENT)
        .select_related("collaborateur", "liste")
        .order_by("id")
    )


def notifier_debut_file_vp(liste: ListeVisitePeriodique) -> None:
    """Aux deux premières lignes encore en attente : SMS « votre tour » / « tour approche »."""
    lignes = list(_lignes_file_attente(liste)[:2])
    for idx, ligne in enumerate(lignes):
        if ligne.sms_jour_j_envoye:
            continue
        collab = ligne.collaborateur
        if not collab:
            logger.warning("SMS VP début file : ligne %s sans collaborateur", ligne.pk)
            continue
        tel = (getattr(collab, "telephone", None) or "").strip()
        if not tel:
            logger.warning(
                "SMS VP début file : pas de téléphone (matricule %s)",
                getattr(collab, "matricule", ""),
            )
            continue
        prenom = _prenom_ou_nom(collab)
        if idx == 0:
            text = (
                f"Bonjour {prenom}, c'est votre tour ! "
                f"Veuillez vous présenter immédiatement à l'infirmerie."
            )
        else:
            text = (
                f"Bonjour {prenom}, votre tour approche bientôt, "
                f"veuillez vous rapprocher de l'infirmerie."
            )
        try:
            send_sms(tel, text, ligne_vp=ligne)
        except Exception:
            logger.exception(
                "SMS VP début file liste=%s ligne=%s",
                liste.reference,
                ligne.pk,
            )


def notifier_n_plus_2_apres_fiche_vp(ligne_traitee: LigneVisitePeriodique) -> None:
    """
    Après première association fiche ↔ ligne : notifier la 2e personne encore en attente.
    """
    liste = ligne_traitee.liste
    remaining = list(_lignes_file_attente(liste))
    if len(remaining) < 2:
        return

    target = remaining[1]
    if target.sms_jour_j_envoye:
        return

    collab = target.collaborateur
    if not collab:
        logger.warning("SMS VP N+2 : ligne cible %s sans collaborateur", target.pk)
        return

    tel = (getattr(collab, "telephone", None) or "").strip()
    if not tel:
        logger.warning(
            "SMS VP N+2 : pas de téléphone (matricule %s)",
            getattr(collab, "matricule", ""),
        )
        return

    prenom = _prenom_ou_nom(collab)
    text = (
        f"Bonjour {prenom}, votre tour approche bientôt. "
        f"Veuillez vous rapprocher de l'infirmerie."
    )
    try:
        send_sms(tel, text, ligne_vp=target)
    except Exception:
        logger.exception(
            "SMS VP N+2 liste=%s ligne_cible=%s",
            liste.reference,
            target.pk,
        )


def _lignes_pour_rappel_veille(liste: ListeVisitePeriodique):
    """Priorité aux lignes PRESENT ; sinon tout le monde sauf absent."""
    qs = liste.lignes.filter(presence=LigneVisitePeriodique.PRESENCE_PRESENT)
    if not qs.exists():
        qs = liste.lignes.exclude(presence=LigneVisitePeriodique.PRESENCE_ABSENT)
    return qs.select_related("collaborateur")


def _texte_rappel_veille(liste: ListeVisitePeriodique, prenom: str) -> str:
    """Message « veille » selon la date de visite (demain / aujourd'hui / autre jour)."""
    date_str = liste.date_visite.strftime("%d/%m/%Y") if liste.date_visite else ""
    today = timezone.localdate()
    demain = today + timedelta(days=1)
    dv = liste.date_visite
    if dv == demain:
        intro = f"prévue demain le {date_str}"
    elif dv == today:
        intro = "prévue aujourd'hui"
    else:
        intro = f"prévue le {date_str}"
    return (
        f"Bonjour {prenom}, vous avez une visite périodique médicale {intro}. "
        f"Merci de vous présenter à l'infirmerie."
    )


def notifier_veille_liste_vp_manuelle(liste: ListeVisitePeriodique) -> dict:
    """
    Envoi manuel (bouton RH / infirmier) des SMS veille pour une liste.

    Retourne un dict pour le JSON API : sent, detail, sms_count.
    """
    if liste.statut in (
        ListeVisitePeriodique.STATUT_BROUILLON,
        ListeVisitePeriodique.STATUT_ARCHIVEE,
    ):
        return {
            "sent": False,
            "detail": "Envoi impossible pour une liste en brouillon ou archivée.",
            "sms_count": 0,
        }
    if liste.statut == ListeVisitePeriodique.STATUT_CLOTUREE:
        return {
            "sent": False,
            "detail": "La liste est clôturée.",
            "sms_count": 0,
        }
    if liste.statut not in (
        ListeVisitePeriodique.STATUT_SOUMISE,
        ListeVisitePeriodique.STATUT_EN_TRAITEMENT,
    ):
        return {
            "sent": False,
            "detail": "La liste doit être soumise ou en traitement.",
            "sms_count": 0,
        }
    if not liste.date_visite:
        return {
            "sent": False,
            "detail": "La date de visite n'est pas définie.",
            "sms_count": 0,
        }

    lignes = _lignes_pour_rappel_veille(liste)
    if not lignes.exists():
        return {
            "sent": False,
            "detail": "Aucune ligne éligible (présences absentes ou liste vide).",
            "sms_count": 0,
        }

    sms_ok = 0
    for ligne in lignes:
        collab = ligne.collaborateur
        if not collab:
            logger.warning("SMS veille VP manuel : ligne %s sans collaborateur", ligne.pk)
            continue
        tel = (getattr(collab, "telephone", None) or "").strip()
        if not tel:
            logger.warning(
                "SMS veille VP manuel : pas de téléphone (matricule %s)",
                getattr(collab, "matricule", ""),
            )
            continue
        prenom = _prenom_ou_nom(collab)
        msg = _texte_rappel_veille(liste, prenom)
        try:
            if send_sms(tel, msg):
                sms_ok += 1
        except Exception:
            logger.exception(
                "SMS veille VP manuel liste=%s ligne=%s",
                liste.reference,
                ligne.pk,
            )

    if sms_ok == 0:
        return {
            "sent": False,
            "detail": (
                "Aucun SMS n'a été accepté par la passerelle "
                "(numéros manquants, invalides ou erreur d'envoi)."
            ),
            "sms_count": 0,
        }

    liste.sms_veille_envoye = True
    liste.save(update_fields=["sms_veille_envoye"])
    return {"sent": True, "detail": "", "sms_count": sms_ok}


def envoyer_rappels_veille_j_moins_1() -> int:
    """
    Listes avec date_visite = demain, statut SOUMISE ou EN_TRAITEMENT, rappel pas encore envoyé.

    Retourne le nombre de listes traitées (flag liste mis à jour).
    """
    demain = timezone.localdate() + timedelta(days=1)
    listes = ListeVisitePeriodique.objects.filter(
        date_visite=demain,
        statut__in=[
            ListeVisitePeriodique.STATUT_SOUMISE,
            ListeVisitePeriodique.STATUT_EN_TRAITEMENT,
        ],
        sms_veille_envoye=False,
    )
    count = 0
    for liste in listes:
        try:
            _envoyer_rappel_veille_une_liste(liste)
            count += 1
        except Exception:
            logger.exception("SMS veille VP : échec liste %s", liste.reference)
    return count


def _envoyer_rappel_veille_une_liste(liste: ListeVisitePeriodique) -> None:
    """Tâche planifiée : date_visite = demain (filtré par l'appelant)."""
    lignes = _lignes_pour_rappel_veille(liste)

    for ligne in lignes:
        collab = ligne.collaborateur
        if not collab:
            logger.warning("SMS veille VP : ligne %s sans collaborateur", ligne.pk)
            continue
        tel = (getattr(collab, "telephone", None) or "").strip()
        if not tel:
            logger.warning(
                "SMS veille VP : pas de téléphone pour matricule %s",
                getattr(collab, "matricule", ""),
            )
            continue
        prenom = _prenom_ou_nom(collab)
        msg = _texte_rappel_veille(liste, prenom)
        try:
            send_sms(tel, msg)
        except Exception:
            logger.exception("SMS veille VP liste=%s ligne=%s", liste.reference, ligne.pk)

    liste.sms_veille_envoye = True
    liste.save(update_fields=["sms_veille_envoye"])


def notifier_jour_j_ligne_vp_manuelle(ligne: LigneVisitePeriodique) -> dict:
    """
    Renvoi manuel d'un SMS « file » pour une ligne (jour J).
    """
    liste = ligne.liste
    if liste.statut not in (
        ListeVisitePeriodique.STATUT_SOUMISE,
        ListeVisitePeriodique.STATUT_EN_TRAITEMENT,
    ):
        return {
            "sent": False,
            "detail": "La liste doit être soumise ou en traitement.",
        }
    if ligne.presence == LigneVisitePeriodique.PRESENCE_ABSENT:
        return {"sent": False, "detail": "La ligne est marquée absente."}

    collab = ligne.collaborateur
    if not collab:
        return {"sent": False, "detail": "Pas de collaborateur sur cette ligne."}
    tel = (getattr(collab, "telephone", None) or "").strip()
    if not tel:
        return {"sent": False, "detail": "Numéro de téléphone manquant pour ce collaborateur."}

    prenom = _prenom_ou_nom(collab)
    text = (
        f"Bonjour {prenom}, votre passage pour la visite périodique approche. "
        f"Merci de vous présenter à l'infirmerie."
    )
    try:
        ok = send_sms(tel, text, ligne_vp=ligne)
    except Exception:
        logger.exception("SMS jour J VP manuel ligne=%s", ligne.pk)
        return {"sent": False, "detail": "Erreur technique lors de l'envoi."}
    if not ok:
        return {
            "sent": False,
            "detail": "La passerelle SMS a refusé l'envoi (quota, format, etc.).",
        }
    return {"sent": True, "detail": ""}
