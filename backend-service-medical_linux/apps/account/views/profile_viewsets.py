# account/views/profile_viewsets.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.account.models import Profile, MedType
from apps.account.serializers import ProfileSerializer, MedTypeSerializer
from apps.account.permissions import MustChangePasswordPermission, IsAdmin


class MedTypeViewSet(viewsets.ModelViewSet):
    """
    CRUD API pour les types de médecins
    """
    queryset = MedType.objects.all()
    serializer_class = MedTypeSerializer
    permission_classes = [
        MustChangePasswordPermission,
        IsAuthenticated,
        IsAdmin,
    ]
    search_fields = ['name']
    ordering_fields = ['id', 'name']


class ProfileViewSet(viewsets.ModelViewSet):
    """
    CRUD API pour les profils utilisateurs
    """
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [
        MustChangePasswordPermission,
        IsAuthenticated,
        IsAdmin,
    ]
    search_fields = ['user__username', 'user__email', 'role']
    ordering_fields = ['id', 'role', 'user__username']

    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """
        Allows users to retrieve their own profile
        """
        try:
            profile = Profile.objects.get(user=request.user)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except Profile.DoesNotExist:
            return Response(
                {'detail': 'Profil non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['patch'])
    def update_phone(self, request, pk=None):
        """
        Update only the phone number of a profile
        """
        profile = self.get_object()
        phone = request.data.get('phone')
        if phone:
            profile.phone = phone
            profile.save()
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        return Response(
            {'error': 'Phone number is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=False, methods=['get'])
    def by_role(self, request):
        """
        Get profiles filtered by role
        """
        role = request.query_params.get('role')
        if not role:
            return Response(
                {'error': 'role parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        profiles = Profile.objects.filter(role=role)
        serializer = self.get_serializer(profiles, many=True)
        return Response(serializer.data)
