# account/views/auth_views.py
from rest_framework_simplejwt.exceptions import TokenError

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from apps.account.models import Profile
from apps.account.serializers import (
    ChangePasswordSerializer,
    UserSerializer,
)
from apps.account.tokens import (
    CustomTokenObtainPairSerializer,
    CustomTokenRefreshSerializer,
    build_auth_context,
    build_french_display_name,
)


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Login endpoint - takes username and password, returns access and refresh tokens
    with additional user information in the response
    """
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = (AllowAny,)


class CustomTokenRefreshView(TokenRefreshView):
    """
    Refresh endpoint - takes refresh token and returns new access token
    """
    serializer_class = CustomTokenRefreshSerializer
    permission_classes = (AllowAny,)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Change password endpoint - required for first login when must_change_password=True
    Automatically sets must_change_password=False after successful change
    
    Returns new tokens with updated user information
    """
    serializer = ChangePasswordSerializer(
        data=request.data,
        context={'request': request}
    )
    if serializer.is_valid():
        user = serializer.save()
        display_name = build_french_display_name(user)

        # Return new tokens with updated must_change_password status
        refresh = RefreshToken.for_user(user)
        auth_context = build_auth_context(user)
        refresh['role'] = auth_context['role']
        refresh['must_change_password'] = auth_context['must_change_password']
        refresh['med_type'] = auth_context['med_type']
        refresh['site_id'] = auth_context['site_id']
        refresh['site_nom'] = auth_context['site_nom']
        refresh['site_template_key'] = auth_context['site_template_key']
        refresh['username'] = display_name

        return Response({
            'message': 'Password changed successfully',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'role': refresh['role'],
            'must_change_password': refresh['must_change_password'],
            'med_type': refresh['med_type'],
            'site_id': refresh['site_id'],
            'site_nom': refresh['site_nom'],
            'site_template_key': refresh['site_template_key'],
            'username': display_name,
            'user_id': user.id,
        }, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_must_change_password(request):
    """
    Check if user must change password
    Returns must_change_password status and a message
    """
    try:
        profile = Profile.objects.get(user=request.user)
        return Response({
            'must_change_password': profile.must_change_password,
            'message': 'You must change your password before proceeding' if profile.must_change_password else 'Password change not required'
        })
    except Profile.DoesNotExist:
        return Response({
            'must_change_password': False,
            'message': 'User profile not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.data.get('refresh')
        token = RefreshToken(refresh_token)
        token.blacklist()  # Invalide le token côté serveur
        return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)
    except TokenError:
        return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)