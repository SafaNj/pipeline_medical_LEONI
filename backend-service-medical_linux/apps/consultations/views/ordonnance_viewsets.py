from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import SiteScopedQuerysetCreateMixin
from apps.consultations.models import Ordonnance
from apps.consultations.permissions import IsInfirmierOrMedecin, IsMedecinTraitant
from apps.consultations.serializers import OrdonnanceSerializer


class OrdonnanceViewSet(SiteScopedQuerysetCreateMixin, viewsets.ModelViewSet):
    queryset = Ordonnance.objects.select_related('consultation').prefetch_related(
        'lignes_ordonnance'
    )
    serializer_class = OrdonnanceSerializer

    def get_permissions(self):
        base_permissions = [MustChangePasswordPermission, IsAuthenticated]

        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            specific_permissions = [IsMedecinTraitant]
        else:
            specific_permissions = [IsInfirmierOrMedecin]

        permissions = [*base_permissions, *specific_permissions]
        return [permission() for permission in permissions]

    @action(detail=False, methods=['get'])
    def by_consultation(self, request):
        consultation_id = request.query_params.get('consultation_id')
        if not consultation_id:
            return Response(
                {'error': 'consultation_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        ordonnances = self.get_queryset().filter(consultation_id=consultation_id)
        serializer = self.get_serializer(ordonnances, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def sans_consultation(self, request):
        ordonnances = self.get_queryset().filter(consultation__isnull=True)
        serializer = self.get_serializer(ordonnances, many=True)
        return Response(serializer.data)
