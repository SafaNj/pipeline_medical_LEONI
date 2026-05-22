from django.db.models import F, Sum
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import SiteScopedQuerysetCreateMixin, get_site_save_kwargs_for_serializer
from apps.act_infirmier.models import MaladieProfessionnelle
from apps.act_infirmier.permissions import IsInfirmier
from apps.act_infirmier.serializers import MaladieProfessionnelleSerializer
from apps.consultations.permissions import IsAnyMedecin


class MaladieProfessionnelleViewSet(SiteScopedQuerysetCreateMixin, viewsets.ModelViewSet):
    queryset = MaladieProfessionnelle.objects.select_related("collaborateur", "infirmiere")
    serializer_class = MaladieProfessionnelleSerializer

    def get_permissions(self):
        base_permissions = [MustChangePasswordPermission, IsAuthenticated]

        if self.action in ("create", "update", "partial_update", "destroy"):
            # Seul l'infirmier peut créer / modifier / supprimer
            specific_permissions = [IsInfirmier]
        else:
            # Lecture : infirmier OU n'importe quel médecin (traitant, travail, contrôleur)
            specific_permissions = [IsInfirmier | IsAnyMedecin]

        permissions = [*base_permissions, *specific_permissions]
        return [permission() for permission in permissions]

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
            return Response({"error": "collaborateur_id parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        queryset = self.get_queryset().filter(collaborateur_id=collaborateur_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def by_mois(self, request):
        mois = request.query_params.get("mois")
        annee = request.query_params.get("annee")
        if not mois or not annee:
            return Response({"error": "mois and annee parameters are required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            mois = int(mois)
            annee = int(annee)
        except (TypeError, ValueError):
            return Response({"error": "mois and annee must be integers"}, status=status.HTTP_400_BAD_REQUEST)
        if mois < 1 or mois > 12:
            return Response({"error": "mois must be between 1 and 12"}, status=status.HTTP_400_BAD_REQUEST)
        queryset = self.get_queryset().filter(date_debut_maladie__year=annee, date_debut_maladie__month=mois)
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
            return Response({"error": "annee must be an integer"}, status=status.HTTP_400_BAD_REQUEST)
        queryset = self.get_queryset().filter(date_debut_maladie__year=annee)
        total = queryset.count()
        total_repos = (
            queryset.aggregate(total=Sum(F("repos_initial") + F("prolongation") + F("rechute"))).get("total") or 0
        )
        return Response({"annee": annee, "total": total, "total_repos": total_repos})