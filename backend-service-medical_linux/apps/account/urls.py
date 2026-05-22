# account/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.account.views import (
    ProfileViewSet,
    MedTypeViewSet,
    MedecinViewSet,
    SiteViewSet,
    InfirmierViewSet,
    RHViewSet,
    HSEEViewSet,
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    change_password,
    check_must_change_password,
)
from apps.account.views.auth_views import logout

# Créer le routeur DRF
router = DefaultRouter()

# Enregistrer les ViewSets avec le routeur (sans RegisterView!)
router.register(r'profiles', ProfileViewSet, basename='profile')
router.register(r'medtypes', MedTypeViewSet, basename='medtype')
router.register(r'medecins', MedecinViewSet, basename='medecin')
router.register(r'sites', SiteViewSet, basename='site')
router.register(r'infirmiers', InfirmierViewSet, basename='infirmier')
router.register(r'rh', RHViewSet, basename='rh')
router.register(r'hsee', HSEEViewSet, basename='hsee')

# URLs patterns
urlpatterns = [
    # JWT Authentication endpoints
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    
    # Password change endpoint (independent, not nested in register)
    path('change-password/', change_password, name='change_password'),
    
    # Check if password change is required
    path('check-must-change-password/', check_must_change_password, name='check_must_change_password'),
    path('logout/', logout, name='logout'),
    # Other routes
    path('', include(router.urls)),
    
    # Routes customisées pour l'authentification
    path('api-auth/', include('rest_framework.urls')),

    
]
