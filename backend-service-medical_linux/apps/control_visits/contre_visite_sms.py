"""
SMS TunisieSMS pour les listes de contre-visite :
- Rappel veille (J-1) — tâche planifiée (ex. 12h).
- Notification des 2 premiers de la file — passage SOUMISE → EN_TRAITEMENT (assignation médecin).
- Cascade N+2 — après chaque saisie de verdict (même logique que ItemPassage / consultations).

Les erreurs SMS ne bloquent jamais le flux métier (journalisation uniquement).
"""

from __future__ import annotations

import logging
from datetime import timedelta

from django.utils import timezone

from apps.control_visits.models import LigneContreVisite, ListeContreVisite
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


def _lignes_file_attente(liste):
    """File du jour : sans verdict, hors absent / reporté, ordre stable."""
    return (
        LigneContreVisite.objects.filter(liste=liste, verdict_saisi=False)
        .exclude(
            presence__in=[
                LigneContreVisite.PRESENCE_ABSENT,
                LigneContreVisite.PRESENCE_REPORTE,
            ]
        )
        .select_related("collaborateur", "liste")
        .order_by("ordre", "pk")
    )


def notifier_debut_file_contre_visite(liste: ListeContreVisite) -> None:
    """
    Aux deux premières lignes encore en attente : SMS « votre tour » / « tour approche ».
    """
    if liste.statut == ListeContreVisite.STATUT_ARCHIVEE:
        return
    lignes = list(_lignes_file_attente(liste)[:2])
    for idx, ligne in enumerate(lignes):
        if ligne.sms_jour_j_envoye:
            continue
        collab = ligne.collaborateur
        if not collab:
            logger.warning("SMS CV début file : ligne %s sans collaborateur", ligne.pk)
            continue
        tel = (getattr(collab, "telephone", None) or "").strip()
        if not tel:
            logger.warning(
                "SMS CV début file : pas de téléphone (matricule %s)",
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
            send_sms(tel, text, ligne_cv=ligne)
        except Exception:
            logger.exception(
                "SMS CV début file liste=%s ligne=%s",
                liste.reference,
                ligne.pk,
            )


def notifier_n_plus_2_apres_verdict(ligne_traitee: LigneContreVisite) -> None:
    """
    Après verdict sur une ligne : notifier la 2e personne encore en attente (indice 1),
    comme pour ItemPassage N+2.
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
        logger.warning("SMS CV N+2 : ligne cible %s sans collaborateur", target.pk)
        return

    tel = (getattr(collab, "telephone", None) or "").strip()
    if not tel:
        logger.warning(
            "SMS CV N+2 : pas de téléphone (matricule %s)",
            getattr(collab, "matricule", ""),
        )
        return

    prenom = _prenom_ou_nom(collab)
    text = (
        f"Bonjour {prenom}, votre tour approche bientôt. "
        f"Veuillez vous rapprocher de l'infirmerie."
    )
    try:
        send_sms(tel, text, ligne_cv=target)
    except Exception:
        logger.exception(
            "SMS CV N+2 liste=%s ligne_cible=%s",
            liste.reference,
            target.pk,
        )


def _lignes_pour_rappel_veille(liste: ListeContreVisite):
    """Priorité aux lignes EN_ATTENTE ; sinon tout le monde sauf absent/reporté."""
    qs = liste.lignes.filter(presence=LigneContreVisite.PRESENCE_EN_ATTENTE)
    if not qs.exists():
        qs = liste.lignes.exclude(
            presence__in=[
                LigneContreVisite.PRESENCE_ABSENT,
                LigneContreVisite.PRESENCE_REPORTE,
            ]
        )
    return qs.select_related("collaborateur")


def envoyer_rappels_veille_j_moins_1() -> int:
    """
    Listes avec date_visite = demain, statut SOUMISE ou EN_TRAITEMENT, rappel pas encore envoyé.

    « Demain » utilise timezone.localdate() : avec TIME_ZONE = Africa/Tunis et USE_TZ = True
    (voir settings), la date correspond au fuseau du serveur Django.

    Retourne le nombre de listes traitées (flag liste mis à jour).
    """
    demain = timezone.localdate() + timedelta(days=1)
    listes = ListeContreVisite.objects.filter(
        date_visite=demain,
        statut__in=[
            ListeContreVisite.STATUT_SOUMISE,
            ListeContreVisite.STATUT_EN_TRAITEMENT,
        ],
        sms_veille_envoye=False,
    )
    count = 0
    for liste in listes:
        try:
            _envoyer_rappel_veille_une_liste(liste)
            count += 1
        except Exception:
            logger.exception("SMS veille CV : échec liste %s", liste.reference)
    return count


def _envoyer_rappel_veille_une_liste(liste: ListeContreVisite) -> None:
    date_str = liste.date_visite.strftime("%d/%m/%Y") if liste.date_visite else ""
    lignes = _lignes_pour_rappel_veille(liste)

    for ligne in lignes:
        collab = ligne.collaborateur
        if not collab:
            logger.warning("SMS veille CV : ligne %s sans collaborateur", ligne.pk)
            continue
        tel = (getattr(collab, "telephone", None) or "").strip()
        if not tel:
            logger.warning(
                "SMS veille CV : pas de téléphone pour matricule %s",
                getattr(collab, "matricule", ""),
            )
            continue
        prenom = _prenom_ou_nom(collab)
        msg = (
            f"Bonjour {prenom}, vous avez une contre-visite médicale prévue demain le {date_str}. "
            f"Merci de vous présenter à l'infirmerie."
        )
        try:
            # Pas de flag ligne sur la veille — anti-doublon au niveau liste.
            send_sms(tel, msg)
        except Exception:
            logger.exception("SMS veille CV liste=%s ligne=%s", liste.reference, ligne.pk)

    liste.sms_veille_envoye = True
    liste.save(update_fields=["sms_veille_envoye"])


def notifier_veille_liste_cv_manuelle(liste: ListeContreVisite) -> dict:
    """Envoi manuel des SMS veille pour une liste. Retour : sent, detail, sms_count."""
    if liste.statut == ListeContreVisite.STATUT_ARCHIVEE:
        return {
            "sent": False,
            "detail": "Envoi impossible pour une liste archivée.",
            "sms_count": 0,
        }
    if liste.statut == ListeContreVisite.STATUT_BROUILLON:
        return {
            "sent": False,
            "detail": "La liste est en brouillon.",
            "sms_count": 0,
        }
    if liste.statut == ListeContreVisite.STATUT_CLOTUREE:
        return {
            "sent": False,
            "detail": "La liste est clôturée.",
            "sms_count": 0,
        }
    if liste.statut not in (
        ListeContreVisite.STATUT_SOUMISE,
        ListeContreVisite.STATUT_EN_TRAITEMENT,
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
            "detail": "Aucune ligne éligible (présences absentes/reportées ou liste vide).",
            "sms_count": 0,
        }

    date_str = liste.date_visite.strftime("%d/%m/%Y")
    sms_ok = 0
    for ligne in lignes:
        collab = ligne.collaborateur
        if not collab:
            logger.warning("SMS veille CV manuel : ligne %s sans collaborateur", ligne.pk)
            continue
        tel = (getattr(collab, "telephone", None) or "").strip()
        if not tel:
            logger.warning(
                "SMS veille CV manuel : pas de téléphone (matricule %s)",
                getattr(collab, "matricule", ""),
            )
            continue
        prenom = _prenom_ou_nom(collab)
        msg = (
            f"Bonjour {prenom}, vous avez une contre-visite médicale prévue demain le {date_str}. "
            f"Merci de vous présenter à l'infirmerie."
        )
        try:
            if send_sms(tel, msg):
                sms_ok += 1
        except Exception:
            logger.exception(
                "SMS veille CV manuel liste=%s ligne=%s",
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
