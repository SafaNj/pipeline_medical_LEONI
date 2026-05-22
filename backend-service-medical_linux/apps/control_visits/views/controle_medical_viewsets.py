from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import SiteScopedQuerysetCreateMixin
from apps.control_visits.models import ControleMedical
from apps.control_visits.permissions import IsMedecinControleur
from apps.control_visits.serializers import ControleMedicalSerializer


class ControleMedicalViewSet(SiteScopedQuerysetCreateMixin, viewsets.ModelViewSet):
    queryset = ControleMedical.objects.select_related(
        'contre_visite',
        'contre_visite__medecin_controleur',
    )
    serializer_class = ControleMedicalSerializer
    permission_classes = [
        MustChangePasswordPermission,
        IsAuthenticated,
        IsMedecinControleur,
    ]

    @action(detail=False, methods=['get'])
    def by_contre_visite(self, request):
        contre_visite_id = request.query_params.get('contre_visite_id')
        if not contre_visite_id:
            return Response(
                {'error': 'contre_visite_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            controle = self.get_queryset().get(contre_visite_id=contre_visite_id)
        except ControleMedical.DoesNotExist:
            return Response(
                {'error': 'Aucun contrôle médical trouvé pour cette contre-visite'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(controle)
        return Response(serializer.data)
