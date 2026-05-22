"""
SMS TunisieSMS pour les listes d'embauche (aligné sur visite_periodique_sms / contre_visite_sms) :
- Rappel veille (J-1) — tâche planifiée.
- Notification des 2 premiers de la file — passage SOUMISE → EN_TRAITEMENT.
- Cascade N+2 — après premier rattachement fiche d'aptitude à un candidat.

Les erreurs SMS ne bloquent jamais le flux métier (journalisation uniquement).
"""

from __future__ import annotations

import logging
from datetime import timedelta

from django.utils import timezone

from apps.embauche.models import CandidatEmbauche, ListeEmbauche
from apps.planning.sms_service import send_sms

logger = logging.getLogger(__name__)


def _prenom_ou_nom_candidat(candidat: CandidatEmbauche) -> str:
    p = (candidat.prenom or "").strip()
    if p:
        return p[:80]
    n = (candidat.nom or "").strip()
    if n:
        return n[:80]
    m = (candidat.matricule or "").strip()
    return m[:80] if m else "candidat"


def _lignes_file_attente(liste: ListeEmbauche):
    """File : pas encore de fiche d'aptitude, hors absent (ordre stable)."""
    return (
        CandidatEmbauche.objects.filter(liste=liste, fiche_aptitude__isnull=True)
        .exclude(presence=CandidatEmbauche.PRESENCE_ABSENT)
        .select_related("liste")
        .order_by("id")
    )


def notifier_debut_file_embauche(liste: ListeEmbauche) -> None:
    """Aux deux premiers candidats encore en attente : SMS « votre tour » / « tour approche »."""
    lignes = list(_lignes_file_attente(liste)[:2])
    for idx, candidat in enumerate(lignes):
        if candidat.sms_jour_j_envoye:
            continue
        tel = (candidat.telephone or "").strip()
        if not tel:
            logger.warning(
                "SMS embauche début file : pas de téléphone (matricule %s)",
                candidat.matricule,
            )
            continue
        prenom = _prenom_ou_nom_candidat(candidat)
        if idx == 0:
            text = (
                f"Bonjour {prenom}, c'est votre tour ! "
                f"Veuillez vous présenter immédiatement à l'infirmerie pour votre visite d'embauche."
            )
        else:
            text = (
                f"Bonjour {prenom}, votre tour approche bientôt, "
                f"veuillez vous rapprocher de l'infirmerie pour votre visite d'embauche."
            )
        try:
            send_sms(tel, text, candidat_embauche=candidat)
        except Exception:
            logger.exception(
                "SMS embauche début file liste=%s candidat=%s",
                liste.reference,
                candidat.pk,
            )


def notifier_n_plus_2_apres_fiche_embauche(candidat_traite: CandidatEmbauche) -> None:
    """Après première association fiche ↔ candidat : notifier le 2e encore en attente."""
    liste = candidat_traite.liste
    remaining = list(_lignes_file_attente(liste))
    if len(remaining) < 2:
        return

    target = remaining[1]
    if target.sms_jour_j_envoye:
        return

    tel = (target.telephone or "").strip()
    if not tel:
        logger.warning(
            "SMS embauche N+2 : pas de téléphone (matricule %s)",
            target.matricule,
        )
        return

    prenom = _prenom_ou_nom_candidat(target)
    text = (
        f"Bonjour {prenom}, votre tour approche bientôt. "
        f"Veuillez vous rapprocher de l'infirmerie pour votre visite d'embauche."
    )
    try:
        send_sms(tel, text, candidat_embauche=target)
    except Exception:
        logger.exception(
            "SMS embauche N+2 liste=%s candidat_cible=%s",
            liste.reference,
            target.pk,
        )


def notifier_debut_file_si_transition_soumise_en_traitement(
    liste: ListeEmbauche, statut_avant: str
) -> None:
    if statut_avant != ListeEmbauche.STATUT_SOUMISE:
        return
    if liste.statut != ListeEmbauche.STATUT_EN_TRAITEMENT:
        return
    try:
        notifier_debut_file_embauche(liste)
    except Exception:
        logger.exception(
            "SMS embauche : échec notifier_debut_file pour liste %s",
            liste.reference,
        )


def _lignes_pour_rappel_veille(liste: ListeEmbauche):
    """Priorité aux candidats PRESENT ; sinon tout le monde sauf absent."""
    qs = liste.candidats.filter(presence=CandidatEmbauche.PRESENCE_PRESENT)
    if not qs.exists():
        qs = liste.candidats.exclude(presence=CandidatEmbauche.PRESENCE_ABSENT)
    return qs


def _texte_rappel_veille(liste: ListeEmbauche, prenom: str) -> str:
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
        f"Bonjour {prenom}, vous avez une visite d'embauche médicale {intro}. "
        f"Merci de vous présenter à l'infirmerie."
    )


def notifier_veille_liste_embauche_manuelle(liste: ListeEmbauche) -> dict:
    """Envoi manuel des SMS veille pour une liste. Retour : sent, detail, sms_count."""
    if liste.statut in (
        ListeEmbauche.STATUT_BROUILLON,
        ListeEmbauche.STATUT_ARCHIVEE,
    ):
        return {
            "sent": False,
            "detail": "Envoi impossible pour une liste en brouillon ou archivée.",
            "sms_count": 0,
        }
    if liste.statut == ListeEmbauche.STATUT_CLOTUREE:
        return {
            "sent": False,
            "detail": "La liste est clôturée.",
            "sms_count": 0,
        }
    if liste.statut not in (
        ListeEmbauche.STATUT_SOUMISE,
        ListeEmbauche.STATUT_EN_TRAITEMENT,
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

    candidats = _lignes_pour_rappel_veille(liste)
    if not candidats.exists():
        return {
            "sent": False,
            "detail": "Aucun candidat éligible (présences absentes ou liste vide).",
            "sms_count": 0,
        }

    sms_ok = 0
    for candidat in candidats:
        tel = (candidat.telephone or "").strip()
        if not tel:
            logger.warning(
                "SMS veille embauche manuel : pas de téléphone (matricule %s)",
                candidat.matricule,
            )
            continue
        prenom = _prenom_ou_nom_candidat(candidat)
        msg = _texte_rappel_veille(liste, prenom)
        try:
            if send_sms(tel, msg):
                sms_ok += 1
        except Exception:
            logger.exception(
                "SMS veille embauche manuel liste=%s candidat=%s",
                liste.reference,
                candidat.pk,
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
    listes = ListeEmbauche.objects.filter(
        date_visite=demain,
        statut__in=[
            ListeEmbauche.STATUT_SOUMISE,
            ListeEmbauche.STATUT_EN_TRAITEMENT,
        ],
        sms_veille_envoye=False,
    )
    count = 0
    for liste in listes:
        try:
            _envoyer_rappel_veille_une_liste(liste)
            count += 1
        except Exception:
            logger.exception("SMS veille embauche : échec liste %s", liste.reference)
    return count


def _envoyer_rappel_veille_une_liste(liste: ListeEmbauche) -> None:
    for candidat in _lignes_pour_rappel_veille(liste):
        tel = (candidat.telephone or "").strip()
        if not tel:
            logger.warning(
                "SMS veille embauche : pas de téléphone pour matricule %s",
                candidat.matricule,
            )
            continue
        prenom = _prenom_ou_nom_candidat(candidat)
        msg = _texte_rappel_veille(liste, prenom)
        try:
            send_sms(tel, msg)
        except Exception:
            logger.exception(
                "SMS veille embauche liste=%s candidat=%s", liste.reference, candidat.pk
            )

    liste.sms_veille_envoye = True
    liste.save(update_fields=["sms_veille_envoye"])


def notifier_jour_j_candidat_embauche_manuel(candidat: CandidatEmbauche) -> dict:
    """Renvoi manuel d'un SMS « file » pour un candidat (jour J)."""
    liste = candidat.liste
    if liste.statut not in (
        ListeEmbauche.STATUT_SOUMISE,
        ListeEmbauche.STATUT_EN_TRAITEMENT,
    ):
        return {
            "sent": False,
            "detail": "La liste doit être soumise ou en traitement.",
        }
    if candidat.presence == CandidatEmbauche.PRESENCE_ABSENT:
        return {"sent": False, "detail": "Le candidat est marqué absent."}

    tel = (candidat.telephone or "").strip()
    if not tel:
        return {"sent": False, "detail": "Numéro de téléphone manquant pour ce candidat."}

    prenom = _prenom_ou_nom_candidat(candidat)
    text = (
        f"Bonjour {prenom}, votre passage pour la visite d'embauche approche. "
        f"Merci de vous présenter à l'infirmerie."
    )
    try:
        ok = send_sms(tel, text, candidat_embauche=candidat)
    except Exception:
        logger.exception("SMS jour J embauche manuel candidat=%s", candidat.pk)
        return {"sent": False, "detail": "Erreur technique lors de l'envoi."}
    if not ok:
        return {
            "sent": False,
            "detail": "La passerelle SMS a refusé l'envoi (quota, format, etc.).",
        }
    return {"sent": True, "detail": ""}
