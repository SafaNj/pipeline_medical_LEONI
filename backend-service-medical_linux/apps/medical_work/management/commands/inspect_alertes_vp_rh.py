"""
Diagnostic pour un collaborateur : périmètre VP, dernières fiches, éligibilité alertes RH.

Exemples (entiers seuls — ne pas mettre de chevrons < >, sous Windows < est une redirection) :

  python manage.py inspect_alertes_vp_rh --collaborateur-id 42
  python manage.py inspect_alertes_vp_rh --collaborateur-id 42 --site-id 1
"""

from django.core.management.base import BaseCommand
from django.db.models import Count

from apps.account.models import Site
from apps.medical_work.alertes_vp_rh import (
    _collaborateurs_liste_vp_reservee,
    _fiches_perimetre_rh,
    compute_alertes_visite_periodique_rh,
)
from apps.medical_work.models import FicheAptitude


class Command(BaseCommand):
    help = (
        "Fiches PERIODIQUE du collaborateur + présence dans compute_alertes_visite_periodique_rh. "
        "Exemple: inspect_alertes_vp_rh --collaborateur-id 42 --site-id 1 (pas de < > autour de l'ID)."
    )

    def add_arguments(self, parser):
        parser.add_argument("--collaborateur-id", type=int, required=True)
        parser.add_argument(
            "--site-id",
            type=int,
            default=None,
            help="Filtrer comme le RH de ce site (sinon sans filtre site = vue large).",
        )
        parser.add_argument(
            "--horizon",
            type=int,
            default=30,
            help="horizon_jours passé à compute_alertes (défaut 30).",
        )

    def handle(self, *args, **options):
        cid = options["collaborateur_id"]
        site_id = options["site_id"]
        horizon = options["horizon"]

        rh_site = Site.objects.filter(pk=site_id).first() if site_id else None

        periodique_qs = (
            FicheAptitude.objects.filter(collaborateur_id=cid, type_visite__iexact="PERIODIQUE")
            .select_related("site", "medecin_travail")
            .order_by("-date_visite", "-pk")
        )
        qs = periodique_qs[:20]

        self.stdout.write(self.style.NOTICE(f"=== Fiches PERIODIQUE (collaborateur_id={cid}) ==="))
        for f in qs:
            self.stdout.write(
                f"  pk={f.pk} date_visite={f.date_visite} site_id={f.site_id} "
                f"medecin_site={f.medecin_travail.site_id if f.medecin_travail_id else None} "
                f"dpv={f.date_prochaine_visite} validite={f.validite_mois}"
            )
        if not periodique_qs.exists():
            self.stdout.write(
                self.style.WARNING(
                    "  -> Aucune fiche PERIODIQUE pour ce collaborateur : "
                    "les alertes VP (segments 1 et 2) ne peuvent pas le citer."
                )
            )

        self.stdout.write(self.style.NOTICE(f"\n=== Fiches par type (collaborateur_id={cid}) ==="))
        by_type = list(
            FicheAptitude.objects.filter(collaborateur_id=cid)
            .values("type_visite")
            .annotate(n=Count("pk"))
            .order_by("type_visite")
        )
        if not by_type:
            self.stdout.write(
                self.style.WARNING("  Aucune FicheAptitude pour ce collaborateur.")
            )
        else:
            for row in by_type:
                self.stdout.write(f"  type_visite={row['type_visite']!r}  n={row['n']}")

        if rh_site is not None:
            perim = _fiches_perimetre_rh(rh_site).filter(collaborateur_id=cid)
            self.stdout.write(
                self.style.NOTICE(
                    f"\n=== Fiches dans périmètre RH (site médecin ou site fiche = {rh_site.id}) ==="
                )
            )
            self.stdout.write(f"  count={perim.count()}")
            for f in perim.select_related("medecin_travail")[:15]:
                self.stdout.write(
                    f"  pk={f.pk} type={f.type_visite!r} date_visite={f.date_visite} "
                    f"site_id={f.site_id} medecin_site="
                    f"{f.medecin_travail.site_id if f.medecin_travail_id else None}"
                )
            if perim.count() > 15:
                self.stdout.write(f"  ... ({perim.count() - 15} autre(s))")

        reserve = _collaborateurs_liste_vp_reservee(rh_site)
        self.stdout.write(self.style.NOTICE("\n=== Liste VP « réservée » (exclusions) ==="))
        self.stdout.write(f"  collaborateur_id {cid} réservé : {cid in reserve}")

        rows, meta = compute_alertes_visite_periodique_rh(rh_site, horizon)
        match = [r for r in rows if r["collaborateur_id"] == cid]
        self.stdout.write(self.style.NOTICE("\n=== Alertes RH (compute) ==="))
        self.stdout.write(f"  rh_site={rh_site} horizon={horizon}")
        self.stdout.write(f"  meta segments: {meta.get('segments')}")
        self.stdout.write(f"  count global: {len(rows)}")
        if match:
            self.stdout.write(self.style.SUCCESS(f"  -> Collaborateur PRÉSENT ({len(match)} ligne(s)):"))
            for r in match:
                self.stdout.write(f"     {r.get('type_alerte')} | {r.get('message_rh', '')[:120]}")
        else:
            self.stdout.write(
                self.style.WARNING(
                    "  -> Collaborateur ABSENT des résultats. Causes fréquentes : aucune fiche "
                    "PERIODIQUE ; fiches hors périmètre (site fiche / médecin titulaire ≠ site RH) ; "
                    "sur liste VP réservée ; échéance hors fenêtre d’anticipation (≤90 j) et "
                    "dernière visite < 365 j."
                )
            )
