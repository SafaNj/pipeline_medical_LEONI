from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import SiteScopedQuerysetCreateMixin, get_site_save_kwargs_for_serializer
from apps.act_infirmier.models import IncidentAvecBon
from apps.act_infirmier.permissions import IsInfirmier
from apps.act_infirmier.serializers import IncidentAvecBonSerializer
from apps.consultations.permissions import IsInfirmierOrMedecin


class IncidentAvecBonViewSet(SiteScopedQuerysetCreateMixin, viewsets.ModelViewSet):
    queryset = IncidentAvecBon.objects.select_related("collaborateur", "infirmiere")
    serializer_class = IncidentAvecBonSerializer

    def get_permissions(self):
        base_permissions = [MustChangePasswordPermission, IsAuthenticated]

        if self.action in ("create", "update", "partial_update", "destroy"):
            specific_permissions = [IsInfirmier]
        else:
            specific_permissions = [IsInfirmierOrMedecin]

        return [p() for p in (*base_permissions, *specific_permissions)]

    def perform_create(self, serializer):
        collaborateur = serializer.validated_data.get("collaborateur")
        segment = collaborateur.segment if collaborateur else ""
        plant_section = collaborateur.plant_section if collaborateur else ""
        site_kwargs = get_site_save_kwargs_for_serializer(serializer, self.request.user)
        serializer.save(
            infirmiere=self.request.user,
            segment=segment,
            plant_section=plant_section,
            **site_kwargs,
        )

    @action(detail=False, methods=["get"])
    def by_collaborateur(self, request):
        collaborateur_id = request.query_params.get("collaborateur_id")
        if not collaborateur_id:
            return Response(
                {"error": "collaborateur_id parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        queryset = self.get_queryset().filter(collaborateur_id=collaborateur_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def by_mois(self, request):
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

        queryset = self.get_queryset().filter(
            date_bon__year=annee, date_bon__month=mois
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        from django.db.models import Count

        annee = request.query_params.get("annee")
        qs = self.get_queryset()
        if annee:
            try:
                qs = qs.filter(date_bon__year=int(annee))
            except (TypeError, ValueError):
                return Response(
                    {"error": "annee must be an integer"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        total = qs.count()
        par_segment = list(
            qs.values("segment").annotate(total=Count("id")).order_by("-total")
        )
        par_destination = list(
            qs.values("destination").annotate(total=Count("id")).order_by("-total")
        )
        par_mois = list(
            qs.values("date_bon__month")
            .annotate(total=Count("id"))
            .order_by("date_bon__month")
        )

        return Response(
            {
                "total": total,
                "par_segment": par_segment,
                "par_destination": par_destination,
                "par_mois": par_mois,
            }
        )
