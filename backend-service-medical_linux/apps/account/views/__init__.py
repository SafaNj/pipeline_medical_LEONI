from .auth_views import (
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    change_password,
    check_must_change_password,
)
from .profile_viewsets import ProfileViewSet, MedTypeViewSet
from .medecin_viewsets import MedecinViewSet
from .site_viewsets import SiteViewSet
from .infirmier_viewsets import InfirmierViewSet
from .rh_viewsets import RHViewSet
from .hsee_viewsets import HSEEViewSet

__all__ = [
    'CustomTokenObtainPairView',
    'CustomTokenRefreshView',
    'change_password',
    'check_must_change_password',
    'ProfileViewSet',
    'MedTypeViewSet',
    'MedecinViewSet',
    'SiteViewSet',
    'InfirmierViewSet',
    'RHViewSet',
    'HSEEViewSet',
]
