# account/views/hsee_viewsets.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.account.models import HSEE
from apps.account.serializers import HSEESerializer
from apps.account.permissions import MustChangePasswordPermission, IsAdmin


class HSEEViewSet(viewsets.ModelViewSet):
    """
    CRUD API pour HSSE (Hygiène, Sécurité, Santé et Environnement)
    """
    queryset = HSEE.objects.select_related('profile')
    serializer_class = HSEESerializer
    permission_classes = [
        MustChangePasswordPermission,
        IsAuthenticated,
        IsAdmin,
    ]
    search_fields = ['profile__user__username', 'zone', 'certification']
    ordering_fields = ['id', 'zone', 'certification']

    @action(detail=False, methods=['get'])
    def by_zone(self, request):
        """
        Get HSSE employees filtered by zone
        """
        zone = request.query_params.get('zone')
        if not zone:
            return Response(
                {'error': 'zone parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        hsee_list = HSEE.objects.filter(zone__icontains=zone)
        serializer = self.get_serializer(hsee_list, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_certification(self, request):
        """
        Get HSSE employees filtered by certification
        """
        certification = request.query_params.get('certification')
        if not certification:
            return Response(
                {'error': 'certification parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        hsee_list = HSEE.objects.filter(certification__icontains=certification)
        serializer = self.get_serializer(hsee_list, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def active_hsee(self, request):
        """
        Get all active HSSE employees
        """
        hsee_list = HSEE.objects.filter(profile__user__is_active=True)
        serializer = self.get_serializer(hsee_list, many=True)
        return Response(serializer.data)
