from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.account.models import Medecin
from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import SiteScopedQuerysetCreateMixin, get_site_save_kwargs_for_serializer
from apps.consultations.permissions import IsAnyMedecin
from apps.control_visits.models import DemandeExpertise
from apps.control_visits.permissions import IsMedecinControleur
from apps.control_visits.serializers import DemandeExpertiseSerializer
from apps.embauche.permissions import IsRH


class DemandeExpertiseViewSet(SiteScopedQuerysetCreateMixin, viewsets.ModelViewSet):
    queryset = DemandeExpertise.objects.select_related(
        'contre_visite',
        'medecin_controleur__profile__user',
    )
    serializer_class = DemandeExpertiseSerializer

    def get_permissions(self):
        base = [MustChangePasswordPermission, IsAuthenticated]
        # Lecture : même périmètre que contre-visites (historique patient). Écriture : médecin contrôleur uniquement.
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            specific = [IsAnyMedecin | IsRH]
        else:
            specific = [IsMedecinControleur]
        return [p() for p in (*base, *specific)]

    def perform_create(self, serializer):
        medecin = Medecin.objects.get(profile__user=self.request.user)
        site_kwargs = get_site_save_kwargs_for_serializer(serializer, self.request.user)
        serializer.save(medecin_controleur=medecin, **site_kwargs)

    @action(detail=False, methods=['get'])
    def by_contre_visite(self, request):
        contre_visite_id = request.query_params.get('contre_visite_id')
        if not contre_visite_id:
            return Response(
                {'error': 'contre_visite_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = self.get_queryset().filter(contre_visite_id=contre_visite_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
