# account/views/infirmier_viewsets.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.account.models import Infirmier
from apps.account.serializers import InfirmierSerializer
from apps.account.permissions import MustChangePasswordPermission, IsAdmin


class InfirmierViewSet(viewsets.ModelViewSet):
    """
    CRUD API pour les infirmiers
    """
    queryset = Infirmier.objects.select_related('profile')
    serializer_class = InfirmierSerializer
    permission_classes = [
        MustChangePasswordPermission,
        IsAuthenticated,
        IsAdmin,
    ]
    search_fields = ['profile__user__username', 'service', 'shift']
    ordering_fields = ['id', 'service', 'shift']

    @action(detail=False, methods=['get'])
    def by_service(self, request):
        """
        Get nurses filtered by service
        """
        service = request.query_params.get('service')
        if not service:
            return Response(
                {'error': 'service parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        infirmiers = Infirmier.objects.filter(service__icontains=service)
        serializer = self.get_serializer(infirmiers, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_shift(self, request):
        """
        Get nurses filtered by shift
        """
        shift = request.query_params.get('shift')
        if not shift:
            return Response(
                {'error': 'shift parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        infirmiers = Infirmier.objects.filter(shift=shift)
        serializer = self.get_serializer(infirmiers, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def active_infirmiers(self, request):
        """
        Get all active nurses
        """
        infirmiers = Infirmier.objects.filter(profile__user__is_active=True)
        serializer = self.get_serializer(infirmiers, many=True)
        return Response(serializer.data)
