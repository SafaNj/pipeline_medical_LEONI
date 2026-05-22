"""
SMS TunisieSMS pour les listes de surveillance médicale spéciale (listes « SMS ») :
- Rappel veille (J-1) — tâche planifiée.
- Deux premiers de la file — passage SOUMISE → EN_TRAITEMENT (assignation médecin du travail).
- Cascade N+2 — après clôture de traitement d'une ligne (traitement_termine).

Aligné sur contre_visite_sms ; les erreurs SMS ne bloquent jamais le flux métier.
"""

from __future__ import annotations

import logging
from datetime import timedelta

from django.utils import timezone

from apps.planning.sms_service import send_sms
from apps.surveillance_speciale.models import LigneSurveillanceSpeciale, ListeSurveillanceSpeciale

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


def _lignes_file_attente(liste: ListeSurveillanceSpeciale):
    return (
        LigneSurveillanceSpeciale.objects.filter(liste=liste, traitement_termine=False)
        .exclude(
            presence__in=[
                LigneSurveillanceSpeciale.PRESENCE_ABSENT,
                LigneSurveillanceSpeciale.PRESENCE_REPORTE,
            ]
        )
        .select_related("collaborateur", "liste")
        .order_by("ordre", "pk")
    )


def notifier_debut_file_surveillance_speciale(liste: ListeSurveillanceSpeciale) -> None:
    if liste.statut == ListeSurveillanceSpeciale.STATUT_ARCHIVEE:
        return
    lignes = list(_lignes_file_attente(liste)[:2])
    for idx, ligne in enumerate(lignes):
        if ligne.sms_jour_j_envoye:
            continue
        collab = ligne.collaborateur
        if not collab:
            logger.warning("SMS SS début file : ligne %s sans collaborateur", ligne.pk)
            continue
        tel = (getattr(collab, "telephone", None) or "").strip()
        if not tel:
            logger.warning(
                "SMS SS début file : pas de téléphone (matricule %s)",
                getattr(collab, "matricule", ""),
            )
            continue
        prenom = _prenom_ou_nom(collab)
        if idx == 0:
            text = (
                f"Bonjour {prenom}, c'est votre tour ! "
                f"Veuillez vous présenter immédiatement à l'infirmerie "
                f"(surveillance médicale spéciale)."
            )
        else:
            text = (
                f"Bonjour {prenom}, votre tour approche bientôt, "
                f"veuillez vous rapprocher de l'infirmerie (surveillance médicale spéciale)."
            )
        try:
            send_sms(tel, text, ligne_ss=ligne)
        except Exception:
            logger.exception(
                "SMS SS début file liste=%s ligne=%s", liste.reference, ligne.pk
            )


def notifier_n_plus_2_apres_traitement(ligne_traitee: LigneSurveillanceSpeciale) -> None:
    liste = ligne_traitee.liste
    remaining = list(_lignes_file_attente(liste))
    if len(remaining) < 2:
        return
    target = remaining[1]
    if target.sms_jour_j_envoye:
        return
    collab = target.collaborateur
    if not collab:
        logger.warning("SMS SS N+2 : ligne cible %s sans collaborateur", target.pk)
        return
    tel = (getattr(collab, "telephone", None) or "").strip()
    if not tel:
        logger.warning(
            "SMS SS N+2 : pas de téléphone (matricule %s)",
            getattr(collab, "matricule", ""),
        )
        return
    prenom = _prenom_ou_nom(collab)
    text = (
        f"Bonjour {prenom}, votre tour approche bientôt. "
        f"Veuillez vous rapprocher de l'infirmerie (surveillance médicale spéciale)."
    )
    try:
        send_sms(tel, text, ligne_ss=target)
    except Exception:
        logger.exception(
            "SMS SS N+2 liste=%s ligne_cible=%s", liste.reference, target.pk
        )


def _lignes_pour_rappel_veille(liste: ListeSurveillanceSpeciale):
    qs = liste.lignes.filter(presence=LigneSurveillanceSpeciale.PRESENCE_PRESENT)
    if not qs.exists():
        qs = liste.lignes.exclude(
            presence__in=[
                LigneSurveillanceSpeciale.PRESENCE_ABSENT,
                LigneSurveillanceSpeciale.PRESENCE_REPORTE,
            ]
        )
    return qs.select_related("collaborateur")


def _texte_rappel_veille(liste: ListeSurveillanceSpeciale, prenom: str) -> str:
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
        f"Bonjour {prenom}, vous avez une surveillance médicale spéciale {intro}. "
        f"Merci de vous présenter à l'infirmerie."
    )


def notifier_veille_liste_ss_manuelle(liste: ListeSurveillanceSpeciale) -> dict:
    if liste.statut == ListeSurveillanceSpeciale.STATUT_BROUILLON:
        return {
            "sent": False,
            "detail": "Envoi impossible pour une liste en brouillon.",
            "sms_count": 0,
        }
    if liste.statut == ListeSurveillanceSpeciale.STATUT_ARCHIVEE:
        return {
            "sent": False,
            "detail": "Envoi impossible pour une liste archivée.",
            "sms_count": 0,
        }
    if liste.statut == ListeSurveillanceSpeciale.STATUT_CLOTUREE:
        return {
            "sent": False,
            "detail": "La liste est clôturée.",
            "sms_count": 0,
        }
    if liste.statut not in (
        ListeSurveillanceSpeciale.STATUT_SOUMISE,
        ListeSurveillanceSpeciale.STATUT_EN_TRAITEMENT,
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
            "detail": "Aucune ligne éligible.",
            "sms_count": 0,
        }
    sms_ok = 0
    for ligne in lignes:
        collab = ligne.collaborateur
        if not collab:
            continue
        tel = (getattr(collab, "telephone", None) or "").strip()
        if not tel:
            continue
        prenom = _prenom_ou_nom(collab)
        msg = _texte_rappel_veille(liste, prenom)
        try:
            if send_sms(tel, msg):
                sms_ok += 1
        except Exception:
            logger.exception("SMS veille SS manuel liste=%s ligne=%s", liste.reference, ligne.pk)
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
    demain = timezone.localdate() + timedelta(days=1)
    listes = ListeSurveillanceSpeciale.objects.filter(
        date_visite=demain,
        statut__in=[
            ListeSurveillanceSpeciale.STATUT_SOUMISE,
            ListeSurveillanceSpeciale.STATUT_EN_TRAITEMENT,
        ],
        sms_veille_envoye=False,
    )
    count = 0
    for liste in listes:
        try:
            _envoyer_rappel_veille_une_liste(liste)
            count += 1
        except Exception:
            logger.exception("SMS veille SS : échec liste %s", liste.reference)
    return count


def _envoyer_rappel_veille_une_liste(liste: ListeSurveillanceSpeciale) -> None:
    for ligne in _lignes_pour_rappel_veille(liste):
        collab = ligne.collaborateur
        if not collab:
            continue
        tel = (getattr(collab, "telephone", None) or "").strip()
        if not tel:
            continue
        prenom = _prenom_ou_nom(collab)
        msg = _texte_rappel_veille(liste, prenom)
        try:
            send_sms(tel, msg)
        except Exception:
            logger.exception("SMS veille SS liste=%s ligne=%s", liste.reference, ligne.pk)
    liste.sms_veille_envoye = True
    liste.save(update_fields=["sms_veille_envoye"])


def notifier_jour_j_ligne_ss_manuelle(ligne: LigneSurveillanceSpeciale) -> dict:
    liste = ligne.liste
    if liste.statut not in (
        ListeSurveillanceSpeciale.STATUT_SOUMISE,
        ListeSurveillanceSpeciale.STATUT_EN_TRAITEMENT,
    ):
        return {"sent": False, "detail": "La liste doit être soumise ou en traitement."}
    if ligne.presence in (
        LigneSurveillanceSpeciale.PRESENCE_ABSENT,
        LigneSurveillanceSpeciale.PRESENCE_REPORTE,
    ):
        return {"sent": False, "detail": "La ligne est absente ou reportée."}
    collab = ligne.collaborateur
    if not collab:
        return {"sent": False, "detail": "Pas de collaborateur sur cette ligne."}
    tel = (getattr(collab, "telephone", None) or "").strip()
    if not tel:
        return {"sent": False, "detail": "Numéro de téléphone manquant."}
    prenom = _prenom_ou_nom(collab)
    text = (
        f"Bonjour {prenom}, votre passage pour la surveillance médicale spéciale approche. "
        f"Merci de vous présenter à l'infirmerie."
    )
    try:
        ok = send_sms(tel, text, ligne_ss=ligne)
    except Exception:
        logger.exception("SMS jour J SS manuel ligne=%s", ligne.pk)
        return {"sent": False, "detail": "Erreur technique lors de l'envoi."}
    if not ok:
        return {
            "sent": False,
            "detail": "La passerelle SMS a refusé l'envoi.",
        }
    return {"sent": True, "detail": ""}
