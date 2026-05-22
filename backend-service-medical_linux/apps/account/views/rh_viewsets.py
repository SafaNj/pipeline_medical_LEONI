# account/views/rh_viewsets.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.account.models import RH
from apps.account.serializers import RHSerializer
from apps.account.permissions import MustChangePasswordPermission, IsAdmin


class RHViewSet(viewsets.ModelViewSet):
    """
    CRUD API pour les ressources humaines
    """
    queryset = RH.objects.select_related('profile')
    serializer_class = RHSerializer
    permission_classes = [
        MustChangePasswordPermission,
        IsAuthenticated,
        IsAdmin,
    ]
    search_fields = ['profile__user__username', 'departement']
    ordering_fields = ['id', 'departement']

    @action(detail=False, methods=['get'])
    def by_departement(self, request):
        """
        Get HR employees filtered by department
        """
        departement = request.query_params.get('departement')
        if not departement:
            return Response(
                {'error': 'departement parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        rh_list = RH.objects.filter(departement__icontains=departement)
        serializer = self.get_serializer(rh_list, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def active_rh(self, request):
        """
        Get all active HR employees
        """
        rh_list = RH.objects.filter(profile__user__is_active=True)
        serializer = self.get_serializer(rh_list, many=True)
        return Response(serializer.data)
