"""
Agrégations pour le dashboard HSEE (ratios standardisés × 200 000 h, etc.).
"""
from __future__ import annotations

from calendar import monthrange
from datetime import date
from decimal import Decimal
from typing import Any

from django.db.models import Count, Q, Sum
from django.utils import timezone

from apps.account.models import Medecin
from apps.account.utils import filter_queryset_by_site
from apps.act_infirmier.models import (
    AccidentTravail,
    DeclarationCNAM,
    IncidentAvecBon,
    IncidentSansBon,
    MaladieProfessionnelle,
    TransfertUrgence,
)
from apps.consultations.models import Consultation
from apps.control_visits.models import ContreVisite
from apps.employees.models import Collaborateur, ResourceIM
from apps.hsee.models import EquipementMedicalEndommage, ParametreHSEEMensuel
from apps.medical_work.models import FicheAptitude
from apps.stock.models import StockMedicament

JOURS_ALERTE_EXPIRATION = 90


def _month_bounds(annee: int, mois: int) -> tuple[date, date]:
    last = monthrange(annee, mois)[1]
    return date(annee, mois, 1), date(annee, mois, last)


def _ratio_times_200k(numerator: Decimal, heures: int) -> float | None:
    if heures <= 0:
        return None
    v = (Decimal(numerator) / Decimal(heures)) * Decimal("200000")
    return float(v.quantize(Decimal("0.0001")))


def _medecin_label(medecin) -> str:
    if not medecin:
        return ""
    user = medecin.profile.user
    name = user.get_full_name().strip()
    return name or user.username


def _site_scope(queryset, site):
    return filter_queryset_by_site(queryset, site)


def build_hsee_dashboard(annee: int, mois: int, site=None, filtres=None) -> dict[str, Any]:
    start, end = _month_bounds(annee, mois)
    today = timezone.localdate()

    param_qs = ParametreHSEEMensuel.objects.filter(annee=annee, mois=mois)
    if site is not None:
        param_qs = param_qs.filter(site=site)
    param = param_qs.first()
    heures = int(param.heures_travaillees) if param else 0
    effectif_param = param.effectif_travailleurs if param else None
    effectif_mp = effectif_param if effectif_param is not None else Collaborateur.objects.count()

    filtres = filtres or {}

    def accidents_bloc(categorie: str) -> dict[str, Any]:
        base = _site_scope(
            AccidentTravail.objects.filter(
                date_accident__gte=start,
                date_accident__lte=end,
                categorie_accident=categorie,
            ),
            site,
        )
        # Appliquer les filtres optionnels
        if filtres.get("avec_arret") == "true":
            base = base.filter(total_jour_perdu__gte=1)
        elif filtres.get("avec_arret") == "false":
            base = base.filter(total_jour_perdu=0)
        if filtres.get("criticite"):
            base = base.filter(criticite__iexact=filtres["criticite"])
        if filtres.get("plant_section"):
            base = base.filter(plant_section__icontains=filtres["plant_section"])
        if filtres.get("nature_lesion"):
            base = base.filter(nature_lesion__icontains=filtres["nature_lesion"])
        if filtres.get("lieu"):
            base = base.filter(lieu_accident__icontains=filtres["lieu"])
        if filtres.get("cause"):
            base = base.filter(cause_accident__icontains=filtres["cause"])
        dept = (filtres.get("departement") or "").strip()
        if dept:
            im_mats: list[int] | None
            try:
                im_mats = list(
                    ResourceIM.objects.using("im_db")
                    .filter(department__icontains=dept)
                    .values_list("matricule", flat=True)
                    .distinct()
                )
            except Exception:
                im_mats = None
            if im_mats is not None:
                if not im_mats:
                    base = base.none()
                else:
                    base = base.filter(collaborateur__matricule__in={str(m) for m in im_mats})
        nombre = base.count()
        avec_arret = base.filter(total_jour_perdu__gte=1).count()
        jours_repos_initial = base.aggregate(s=Sum("repos_initial"))["s"] or 0
        jours_perdus_total = base.aggregate(s=Sum("total_jour_perdu"))["s"] or 0
        return {
            "nombre": nombre,
            "nombre_avec_jours_repos_geq_1": avec_arret,
            "ratio_q107": _ratio_times_200k(Decimal(avec_arret), heures),
            "jours_repos_initial_total": int(jours_repos_initial),
            "jours_perdus_total": int(jours_perdus_total),
            "ratio_q110": _ratio_times_200k(Decimal(jours_perdus_total), heures),
        }

    incidents_sans = _site_scope(
        IncidentSansBon.objects.filter(
            date_incident__gte=start,
            date_incident__lte=end,
        ),
        site,
    ).count()
    incidents_avec = _site_scope(
        IncidentAvecBon.objects.filter(
            date_bon__gte=start,
            date_bon__lte=end,
        ),
        site,
    ).count()

    mp_qs = _site_scope(
        MaladieProfessionnelle.objects.filter(
            date_debut_maladie__gte=start,
            date_debut_maladie__lte=end,
        ),
        site,
    )
    # Count only TMS for ratio calculations
    nb_tms = mp_qs.filter(is_tms=True).count()
    jours_mp = mp_qs.aggregate(s=Sum("repos_total"))["s"] or 0
    ratio_mp = None
    if effectif_mp > 0:
        ratio_mp = float((Decimal(nb_tms) / Decimal(effectif_mp) * Decimal(1000)).quantize(Decimal("0.0001")))

    cv_qs = _site_scope(ContreVisite.objects.filter(date__gte=start, date__lte=end), site)
    contre_accord = cv_qs.filter(refus_repos=False, duree_repos__gte=1).count()
    contre_refus = cv_qs.filter(Q(refus_repos=True) | Q(duree_repos=0)).count()

    consultations = _site_scope(
        Consultation.objects.filter(
            date_consultation__date__gte=start,
            date_consultation__date__lte=end,
        ).select_related("medecin__profile__user"),
        site,
    )
    by_med = {}
    for c in consultations:
        mid = c.medecin_id
        if mid not in by_med:
            by_med[mid] = {"medecin_id": mid, "medecin": _medecin_label(c.medecin), "nombre": 0}
        by_med[mid]["nombre"] += 1
    visites_par_medecin_traitant = sorted(by_med.values(), key=lambda x: x["medecin"])

    nb_transferts = _site_scope(
        TransfertUrgence.objects.filter(date__gte=start, date__lte=end),
        site,
    ).count()

    stocks = _site_scope(StockMedicament.objects.select_related("medicament").all(), site)
    nb_rupture = 0
    nb_stock_limite = 0
    nb_proche_expiration = 0
    nb_perime = 0
    quantites_par_article: list[dict[str, Any]] = []

    for sm in stocks:
        q = sm.quantite
        seuil = sm.seuil_alerte
        exp = sm.date_expiration
        quantites_par_article.append(
            {
                "medicament_id": sm.medicament_id,
                "nom": str(sm.medicament),
                "quantite": q,
            }
        )
        if q == 0:
            nb_rupture += 1
        elif q <= seuil:
            nb_stock_limite += 1
        if exp:
            if exp < today:
                nb_perime += 1
            elif (exp - today).days <= JOURS_ALERTE_EXPIRATION:
                nb_proche_expiration += 1

    quantites_par_article.sort(key=lambda x: x["nom"])
    quantites_par_article = quantites_par_article[:500]

    nb_equipements_endommages = _site_scope(
        EquipementMedicalEndommage.objects.filter(
            date_constat__gte=start,
            date_constat__lte=end,
        ),
        site,
    ).count()

    fa_rows = list(
        _site_scope(
            FicheAptitude.objects.filter(date_visite__gte=start, date_visite__lte=end),
            site,
        )
        .values("medecin_travail_id", "type_visite")
        .annotate(nombre=Count("id"))
        .order_by("medecin_travail_id", "type_visite")
    )
    med_ids = {r["medecin_travail_id"] for r in fa_rows if r["medecin_travail_id"]}
    medecins_by_id = {
        m.id: m
        for m in _site_scope(
            Medecin.objects.filter(pk__in=med_ids).select_related("profile__user"),
            site,
        )
    }
    type_labels = dict(FicheAptitude.TYPE_VISITE_CHOICES)
    visites_medecin_travail = []
    for row in fa_rows:
        med = medecins_by_id.get(row["medecin_travail_id"])
        label = _medecin_label(med) if med else ""
        tv = row["type_visite"]
        visites_medecin_travail.append(
            {
                "medecin_travail_id": row["medecin_travail_id"],
                "medecin": label,
                "type_visite": tv,
                "type_visite_display": type_labels.get(tv, tv),
                "nombre": row["nombre"],
            }
        )

    decl_mois = _site_scope(
        DeclarationCNAM.objects.filter(
            date_accident__gte=start,
            date_accident__lte=end,
        ),
        site,
    )
    soumises = _site_scope(
        DeclarationCNAM.objects.filter(
            date_cachet_cnam__gte=start,
            date_cachet_cnam__lte=end,
        ),
        site,
    ).count()
    en_attente = decl_mois.filter(date_cachet_cnam__isnull=True).count()
    en_retard = decl_mois.filter(nb_jours_retard__gt=0).count()

    return {
        "annee": annee,
        "mois": mois,
        "periode": {"debut": start.isoformat(), "fin": end.isoformat()},
        "parametre": (
            {
                "heures_travaillees": heures,
                "effectif_travailleurs": effectif_param,
                "effectif_utilise_pour_mp": effectif_mp,
            }
            if param
            else None
        ),
        "ratios_desactive_si_heures_nulles": heures <= 0,
        "accidents_travail": accidents_bloc(AccidentTravail.CATEGORIE_TRAVAIL),
        "accidents_trajet": accidents_bloc(AccidentTravail.CATEGORIE_TRAJET),
        "incidents": {
            "mois": mois,
            "nombre_total": incidents_sans + incidents_avec,
            "nombre_avec_bon": incidents_avec,
            "nombre_sans_bon": incidents_sans,
        },
        "maladies_professionnelles": {
            "nombre_tms": nb_tms,
            "ratio_tms_pour_1000_travailleurs": ratio_mp,
            "jours_repos_total": int(jours_mp),
        },
        "contre_visites": {
            "repos_accorde": contre_accord,
            "refus": contre_refus,
        },
        "visites_medecin_traitant": visites_par_medecin_traitant,
        "transferts_urgences": {"nombre": nb_transferts},
        "inventaire": {
            "medicaments": {
                "stock_limite": nb_stock_limite,
                "rupture": nb_rupture,
                "proche_expiration": nb_proche_expiration,
                "perimes": nb_perime,
                "quantites_par_article": quantites_par_article,
            },
            "equipements_endommages": nb_equipements_endommages,
        },
        "visites_medicales_medecin_travail": visites_medecin_travail,
        "declarations_cnam": {
            "soumises_mois": soumises,
            "en_attente": en_attente,
            "en_retard": en_retard,
        },
    }
