# account/views/medecin_viewsets.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.account.models import Medecin, Profile
from apps.account.serializers import MedecinSerializer
from apps.account.permissions import MustChangePasswordPermission, IsAdmin


class MedecinViewSet(viewsets.ModelViewSet):
    """
    CRUD API pour les médecins
    """
    queryset = Medecin.objects.select_related('profile', 'med_type')
    serializer_class = MedecinSerializer
    permission_classes = [
        MustChangePasswordPermission,
        IsAuthenticated,
        IsAdmin,
    ]
    search_fields = ['profile__user__username', 'specialite', 'numero_ordre']
    ordering_fields = ['id', 'specialite', 'grade']

    @action(detail=False, methods=['get'])
    def by_specialite(self, request):
        """
        Get doctors filtered by speciality
        """
        specialite = request.query_params.get('specialite')
        if not specialite:
            return Response(
                {'error': 'specialite parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        medecins = Medecin.objects.filter(specialite__icontains=specialite)
        serializer = self.get_serializer(medecins, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_med_type(self, request):
        """
        Get doctors filtered by medical type
        """
        med_type_id = request.query_params.get('med_type_id')
        if not med_type_id:
            return Response(
                {'error': 'med_type_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        medecins = Medecin.objects.filter(med_type_id=med_type_id)
        serializer = self.get_serializer(medecins, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def active_medecins(self, request):
        """
        Get all active doctors
        """
        medecins = Medecin.objects.filter(profile__user__is_active=True)
        serializer = self.get_serializer(medecins, many=True)
        return Response(serializer.data)
