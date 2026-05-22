"""
Logique partagée : GET /api/medical-work/fiches-aptitude/alertes-visite-periodique-rh/

Règles :

- Périmètre RH : fiche ``site_id = site RH`` ou ``medecin_travail.site_id = site RH``.
- Exclusion liste VP : collaborateur sur liste BROUILLON / SOUMISE / EN_TRAITEMENT (même site).
- Référence : **dernière** fiche du périmètre pour le collaborateur (``date_visite`` la plus récente,
  tous types de visite confondus).
- Échéance : ``add_calendar_months(date_visite, 12)``.
- Fenêtre : inclusion si les jours jusqu'à l'échéance sont ``<= min(horizon_jours, ANTICIPATION_JOURS)``
  ou si l'échéance est dépassée (retard).
- Type d'alerte affiché : toujours ``VISITE_PERIODIQUE``.

Modèles : ``FicheAptitude``, ``LigneVisitePeriodique`` / ``ListeVisitePeriodique``.
"""

from __future__ import annotations

from itertools import groupby

from django.db.models import Q
from django.utils import timezone

from apps.employees.models import Collaborateur
from apps.medical_work.date_utils import add_calendar_months
from apps.medical_work.models import FicheAptitude
from apps.visites_periodiques.models import LigneVisitePeriodique, ListeVisitePeriodique

ANTICIPATION_JOURS = 30
PERIODICITE_MOIS = 12
HORIZON_JOURS_MAX = 3660

LISTE_STATUTS_RESERVE_COLLAB = (
    ListeVisitePeriodique.STATUT_BROUILLON,
    ListeVisitePeriodique.STATUT_SOUMISE,
    ListeVisitePeriodique.STATUT_EN_TRAITEMENT,
)


def _fiches_perimetre_rh(rh_site):
    qs = FicheAptitude.objects.filter(collaborateur_id__isnull=False)
    if rh_site is None:
        return qs
    return qs.filter(Q(site_id=rh_site.id) | Q(medecin_travail__site_id=rh_site.id))


def _collaborateurs_liste_vp_reservee(rh_site):
    lvp = LigneVisitePeriodique.objects.filter(liste__statut__in=LISTE_STATUTS_RESERVE_COLLAB)
    if rh_site is not None:
        lvp = lvp.filter(
            Q(liste__medecin__site_id=rh_site.id)
            | Q(liste__cree_par__rh__site_id=rh_site.id)
            | Q(liste__cree_par__infirmier__site_id=rh_site.id)
            | Q(liste__cree_par__medecin__site_id=rh_site.id)
        )
    return set(lvp.values_list("collaborateur_id", flat=True))


def _nom_display(collab: Collaborateur | None) -> str:
    if not collab:
        return ""
    return (
        f"{collab.nom or ''} {collab.prenom or ''}".strip()
        or (collab.matricule or "")
    )


def _vp_alert_row(last_fiche: FicheAptitude, collab: Collaborateur | None, today, horizon_jours: int):
    """Une seule règle : échéance = date_visite + 12 mois ; ``type_alerte`` toujours VISITE_PERIODIQUE."""
    dv = last_fiche.date_visite
    if not dv:
        return None

    echeance = add_calendar_months(dv, PERIODICITE_MOIS)
    jours_eff = (echeance - today).days
    seuil = min(horizon_jours, ANTICIPATION_JOURS)
    if jours_eff > seuil:
        return None

    est_en_retard = jours_eff < 0
    nom = _nom_display(collab)
    cid = last_fiche.collaborateur_id

    if est_en_retard:
        msg = (
            f"Visite périodique en retard pour {nom or 'le collaborateur'} "
            f"(échéance le {echeance.strftime('%d/%m/%Y')}, "
            f"{abs(jours_eff)} jour(s) après la date limite)."
        )
    else:
        msg = (
            f"Visite périodique à planifier pour {nom or 'le collaborateur'} "
            f"(échéance le {echeance.strftime('%d/%m/%Y')}, dans {jours_eff} jour(s))."
        )

    return {
        "collaborateur_id": cid,
        "matricule": collab.matricule if collab else None,
        "nom": collab.nom if collab else None,
        "prenom": collab.prenom if collab else None,
        "derniere_visite_date": dv.isoformat(),
        "echeance": echeance.isoformat(),
        "jours_avant_echeance": jours_eff,
        "est_en_retard": est_en_retard,
        "message_rh": msg,
        "type_alerte": "VISITE_PERIODIQUE",
        "type_visite": last_fiche.type_visite,
    }


def compute_alertes_visite_periodique_rh(rh_site, horizon_jours=30):
    """
    Retourne (rows: list[dict], meta: dict).

    ``horizon_jours`` borne l'anticipation avec ``min(horizon_jours, ANTICIPATION_JOURS)``.
    """
    if horizon_jours < 1:
        horizon_jours = 30
    horizon_jours = min(int(horizon_jours), HORIZON_JOURS_MAX)

    today = timezone.localdate()
    reserve = _collaborateurs_liste_vp_reservee(rh_site)

    fiches_qs = (
        _fiches_perimetre_rh(rh_site)
        .filter(date_visite__isnull=False, collaborateur_id__isnull=False)
        .select_related("collaborateur")
        .order_by("collaborateur_id", "-date_visite", "-pk")
    )

    rows = []
    segments = {
        "VISITE_PERIODIQUE": 0,
        "VP_CALENDRIER_12_MOIS": 0,
        "RETARD_SUIVI_MEDICAL": 0,
    }

    for cid, group in groupby(fiches_qs, key=lambda f: f.collaborateur_id):
        lst = list(group)
        if cid in reserve:
            continue

        last_fiche = lst[0]
        collab = last_fiche.collaborateur

        built = _vp_alert_row(last_fiche, collab, today, horizon_jours)
        if built:
            rows.append(built)
            segments["VISITE_PERIODIQUE"] += 1

    rows.sort(key=lambda r: (r["echeance"], str(r["collaborateur_id"])))

    en_retard = sum(1 for r in rows if r["est_en_retard"])
    a_planifier = sum(1 for r in rows if not r["est_en_retard"])

    meta = {
        "anticipation_jours": ANTICIPATION_JOURS,
        "periodicite_mois": PERIODICITE_MOIS,
        "horizon_jours": horizon_jours,
        "total": len(rows),
        "en_retard": en_retard,
        "a_planifier": a_planifier,
        "segments": segments,
    }

    return rows, meta
