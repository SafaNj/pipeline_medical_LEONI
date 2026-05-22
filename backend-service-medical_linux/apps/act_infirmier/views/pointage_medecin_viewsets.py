from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.account.permissions import IsAnyMedecinOrHSSE, MustChangePasswordPermission
from apps.account.utils import (
    SiteScopedQuerysetCreateMixin,
    get_site_save_kwargs_for_serializer,
    get_site_utilisateur,
)
from apps.act_infirmier.models import AbsenceMedecin, PointageMedecin
from apps.act_infirmier.permissions import IsInfirmier
from apps.act_infirmier.serializers import PointageMedecinSerializer
from apps.consultations.permissions import IsInfirmierOrMedecin


class PointageMedecinViewSet(SiteScopedQuerysetCreateMixin, viewsets.ModelViewSet):
    queryset = PointageMedecin.objects.select_related(
        "medecin__profile__user", "infirmiere"
    )
    serializer_class = PointageMedecinSerializer

    def get_permissions(self):
        base_permissions = [MustChangePasswordPermission, IsAuthenticated]
        if self.action == "medecins_liste":
            specific_permissions = [IsAnyMedecinOrHSSE]
        elif self.action in ("create", "update", "partial_update", "destroy"):
            specific_permissions = [IsInfirmier]
        else:
            specific_permissions = [IsInfirmierOrMedecin]
        return [p() for p in (*base_permissions, *specific_permissions)]

    def perform_create(self, serializer):
        site_kwargs = get_site_save_kwargs_for_serializer(serializer, self.request.user)
        serializer.save(infirmiere=self.request.user, **site_kwargs)

    def _site_scoped_medecins_queryset(self, request):
        from apps.account.models import Medecin

        qs = Medecin.objects.select_related("profile__user", "med_type")
        site = get_site_utilisateur(request.user)
        if site is not None:
            qs = qs.filter(site=site)
        return qs

    # ─── NOUVELLE ACTION 
    @action(detail=False, methods=["get"], url_path="medecins_liste")
    def medecins_liste(self, request):
        """
        Retourne la liste de tous les médecins avec leurs infos essentielles.
        Accessible par l'infirmière (IsInfirmierOrMedecin).
        Evite le 403 de /api/account/medecins/ qui est réservé IsAdmin.
        """
        medecins = self._site_scoped_medecins_queryset(request)

        result = []
        for m in medecins:
            try:
                u = m.profile.user
                nom_complet = f"{u.first_name} {u.last_name}".strip()
                nom = f"Dr. {nom_complet}" if nom_complet else f"Dr. {u.username}"
            except Exception:
                nom = f"Médecin #{m.id}"
            result.append({
                "id": m.id,
                "medecin_nom": nom,
                "specialite": m.specialite or "",
                "med_type": m.med_type.name if m.med_type else None,
                "heures_par_defaut": m.heures_par_defaut,
            })
        return Response(result)

    #  ─── ACTIONS DE FILTRAGE ET STATS 

    @action(detail=False, methods=["get"])
    def by_mois(self, request):
        mois = request.query_params.get("mois")
        annee = request.query_params.get("annee")
        medecin_id = request.query_params.get("medecin_id")

        if not mois or not annee:
            return Response(
                {"error": "mois and annee parameters are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            mois = int(mois)
            annee = int(annee)
        except (TypeError, ValueError):
            return Response(
                {"error": "mois and annee must be integers"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if mois < 1 or mois > 12:
            return Response(
                {"error": "mois must be between 1 and 12"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = self.get_queryset().filter(mois=mois, annee=annee)
        if medecin_id:
            qs = qs.filter(medecin_id=medecin_id)

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        annee = request.query_params.get("annee")
        medecin_id = request.query_params.get("medecin_id")

        if annee is None:
            annee = timezone.localdate().year
        try:
            annee = int(annee)
        except (TypeError, ValueError):
            return Response(
                {"error": "annee must be an integer"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = self.get_queryset().filter(annee=annee)
        if medecin_id:
            qs = qs.filter(medecin_id=medecin_id)

        total_heures = qs.aggregate(total=Sum("heures_travaillees"))["total"] or 0
        total_jours_presence = qs.count()
        par_mois = list(
            qs.values("mois")
            .annotate(total_heures=Sum("heures_travaillees"), total_jours=Count("id"))
            .order_by("mois")
        )

        return Response(
            {
                "annee": annee,
                "total_heures": total_heures,
                "total_jours_presence": total_jours_presence,
                "par_mois": par_mois,
            }
        )

    @action(detail=False, methods=["get"])
    def resume_mensuel(self, request):
        from apps.account.models import Medecin

        mois = request.query_params.get("mois")
        annee = request.query_params.get("annee")

        if not mois or not annee:
            return Response(
                {"error": "mois and annee parameters are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            mois = int(mois)
            annee = int(annee)
        except (TypeError, ValueError):
            return Response(
                {"error": "mois and annee must be integers"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if mois < 1 or mois > 12:
            return Response(
                {"error": "mois must be between 1 and 12"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        medecins = self._site_scoped_medecins_queryset(request)


        site = get_site_utilisateur(request.user)
        pointages_qs = PointageMedecin.objects.filter(mois=mois, annee=annee).select_related(
            "medecin"
        )
        absences_qs = AbsenceMedecin.objects.filter(mois=mois, annee=annee).select_related(
            "medecin"
        )
        if site is not None:
            pointages_qs = pointages_qs.filter(medecin__site=site)
            absences_qs = absences_qs.filter(medecin__site=site)

        pointages_by_medecin: dict[int, list] = {}
        for p in pointages_qs:
            pointages_by_medecin.setdefault(p.medecin_id, []).append(p)

        absences_by_medecin: dict[int, list] = {}
        for a in absences_qs:
            absences_by_medecin.setdefault(a.medecin_id, []).append(a)

        result = []
        for medecin in medecins:
            try:
                u = medecin.profile.user
                nom = f"Dr. {u.first_name} {u.last_name}".strip()
            except Exception:
                nom = f"Médecin #{medecin.id}"
            pts = pointages_by_medecin.get(medecin.id, [])
            abs_ = absences_by_medecin.get(medecin.id, [])
            result.append(
                {
                    "medecin_id": medecin.id,
                    "medecin_nom": nom,
                    "medecin_specialite": medecin.specialite,
                    "medecin_type": medecin.med_type.name if medecin.med_type else None,
                    "total_heures": sum(p.heures_travaillees for p in pts),
                    "total_jours_presence": len(pts),
                    "total_jours_absence": len(abs_),
                    "jours_presence": [
                        {"date": str(p.date), "heures": p.heures_travaillees, "remarque": p.remarque, "id": p.id}
                        for p in sorted(pts, key=lambda x: x.date)
                    ],
                    "jours_absence": [
                        {"date": str(a.date), "motif": a.motif, "id": a.id}
                        for a in sorted(abs_, key=lambda x: x.date)
                    ],
                }
            )

        return Response({"mois": mois, "annee": annee, "medecins": result})