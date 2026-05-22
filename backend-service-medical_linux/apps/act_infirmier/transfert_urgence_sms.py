"""
SMS TunisieSMS au chauffeur — envoyé une fois l’ordre de transport enregistré
(le « bon » = numéro d’ordre de transport = TransfertUrgence.num_ordre).

Les erreurs ne bloquent pas la sauvegarde.
"""

from __future__ import annotations

import logging

from apps.act_infirmier.models import OrdreTransport
from apps.planning.sms_service import send_sms

logger = logging.getLogger(__name__)


def notifier_chauffeur_si_besoin(transfert, telephone_avant: str = "") -> None:
    """
    Envoie un SMS au chauffeur si :
    - un ordre de transport existe pour ce transfert (saisie infirmier faite) ;
    - un numéro chauffeur est renseigné ;
    - pas de doublon (même numéro déjà notifié avec succès).

    telephone_avant : valeur précédente du téléphone (mise à jour du transfert).
    """
    tel = (transfert.telephone_chauffeur or "").strip()
    avant = (telephone_avant or "").strip()

    if not tel:
        return

    if not OrdreTransport.objects.filter(transfert_id=transfert.pk).exists():
        return

    if transfert.sms_chauffeur_envoye and tel == avant:
        return

    # Libellés demandés par l’encadrement : numéro de bon, nom du site, destination.
    nom_site = ""
    try:
        site = getattr(transfert, "site", None)
        if site is not None:
            nom_site = (getattr(site, "nom", None) or "").strip()
    except Exception:
        nom_site = ""
    if not nom_site:
        # Pas de caractère typographique (tiret long) : certains SMS affichent "?" en GSM.
        nom_site = (transfert.plant or transfert.depart or "").strip() or "-"

    n = int(transfert.num_ordre) if transfert.num_ordre is not None else 0
    # Eviter "n°" (caractère ° Unicode) : beaucoup de passerelles SMS l’affichent "n?4".
    # Sauts de ligne (\n) : la plupart des téléphones affichent chaque info sur une ligne.
    msg = (
        f"Urgence - ordre de transport.\n"
        f"Numero bon: {n}\n"
        f"Site: {nom_site}\n"
        f"Destination: {transfert.destination}"
    )

    try:
        ok = send_sms(tel, msg)
        if ok:
            transfert.sms_chauffeur_envoye = True
            transfert.save(update_fields=["sms_chauffeur_envoye"])
        else:
            logger.warning(
                "SMS chauffeur transfert urgence non envoyé (gateway) transfert_id=%s",
                transfert.pk,
            )
    except Exception:
        logger.exception(
            "SMS chauffeur transfert urgence transfert_id=%s",
            getattr(transfert, "pk", None),
        )
