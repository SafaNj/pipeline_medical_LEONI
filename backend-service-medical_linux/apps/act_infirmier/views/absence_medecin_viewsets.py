from django.db.models import Count
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import SiteScopedQuerysetCreateMixin, get_site_save_kwargs_for_serializer
from apps.act_infirmier.models import AbsenceMedecin
from apps.act_infirmier.permissions import IsInfirmier
from apps.act_infirmier.serializers import AbsenceMedecinSerializer
from apps.consultations.permissions import IsInfirmierOrMedecin


class AbsenceMedecinViewSet(SiteScopedQuerysetCreateMixin, viewsets.ModelViewSet):
    queryset = AbsenceMedecin.objects.select_related(
        "medecin__profile__user", "infirmiere"
    )
    serializer_class = AbsenceMedecinSerializer

    def get_permissions(self):
        base_permissions = [MustChangePasswordPermission, IsAuthenticated]
        if self.action in ("create", "update", "partial_update", "destroy"):
            specific_permissions = [IsInfirmier]
        else:
            specific_permissions = [IsInfirmierOrMedecin]
        return [p() for p in (*base_permissions, *specific_permissions)]

    def perform_create(self, serializer):
        site_kwargs = get_site_save_kwargs_for_serializer(serializer, self.request.user)
        serializer.save(infirmiere=self.request.user, **site_kwargs)

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

        total_jours_absence = qs.count()
        par_mois = list(
            qs.values("mois").annotate(total=Count("id")).order_by("mois")
        )
        motifs_frequents = list(
            qs.exclude(motif="")
            .values("motif")
            .annotate(total=Count("id"))
            .order_by("-total")[:10]
        )

        return Response(
            {
                "annee": annee,
                "total_jours_absence": total_jours_absence,
                "par_mois": par_mois,
                "motifs_frequents": motifs_frequents,
            }
        )
