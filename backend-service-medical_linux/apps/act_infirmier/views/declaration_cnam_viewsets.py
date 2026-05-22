from django.db.models import Count
from django.db.models.functions import ExtractMonth
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import SiteScopedQuerysetCreateMixin, get_site_save_kwargs_for_serializer
from apps.act_infirmier.models import DeclarationCNAM
from apps.act_infirmier.permissions import IsInfirmier
from apps.act_infirmier.serializers import DeclarationCNAMSerializer
from apps.consultations.permissions import IsInfirmierOrMedecin


class DeclarationCNAMViewSet(SiteScopedQuerysetCreateMixin, viewsets.ModelViewSet):
    queryset = DeclarationCNAM.objects.select_related("collaborateur", "infirmiere")
    serializer_class = DeclarationCNAMSerializer

    def get_permissions(self):
        base_permissions = [MustChangePasswordPermission, IsAuthenticated]

        if self.action in ("create", "update", "partial_update", "destroy"):
            specific_permissions = [IsInfirmier]
        else:
            specific_permissions = [IsInfirmierOrMedecin]

        return [p() for p in (*base_permissions, *specific_permissions)]

    def perform_create(self, serializer):
        collaborateur = serializer.validated_data.get("collaborateur")
        matricule_cnss = collaborateur.numero_cnss if collaborateur else ""
        site_kwargs = get_site_save_kwargs_for_serializer(serializer, self.request.user)
        serializer.save(
            infirmiere=self.request.user,
            matricule_cnss=matricule_cnss,
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
            date_accident__year=annee,
            date_accident__month=mois,
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        annee = request.query_params.get("annee")
        if annee is None:
            annee = timezone.localdate().year

        try:
            annee = int(annee)
        except (TypeError, ValueError):
            return Response(
                {"error": "annee must be an integer"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = self.get_queryset().filter(date_accident__year=annee)

        total = qs.count()
        total_en_retard = qs.filter(nb_jours_retard__gt=0).count()
        par_type_accident = list(
            qs.values("type_accident").annotate(total=Count("id")).order_by("-total")
        )
        par_mois = list(
            qs.annotate(mois=ExtractMonth("date_accident"))
            .values("mois")
            .annotate(total=Count("id"))
            .order_by("mois")
        )

        return Response(
            {
                "annee": annee,
                "total": total,
                "total_en_retard": total_en_retard,
                "par_type_accident": par_type_accident,
                "par_mois": par_mois,
            }
        )

    @action(detail=False, methods=["get"])
    def en_retard(self, request):
        queryset = self.get_queryset().filter(nb_jours_retard__gt=0).order_by("-nb_jours_retard")
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
