from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.medical_work.views import (
    CertificatAptitudeViewSet,
    DemandeBilanViewSet,
    DemandeExamenViewSet,
    FicheLiaisonViewSet,
    FicheAptitudeViewSet,
    OrdonnanceViewSet,
)
from apps.visites_periodiques.views import (
    LigneVisitePeriodiqueViewSet,
    ListeVisitePeriodiqueViewSet,
)

router = DefaultRouter()
router.register(r'fiches-aptitude', FicheAptitudeViewSet, basename='fiches-aptitude')
router.register(r'demandes-bilan', DemandeBilanViewSet, basename='demandes-bilan')
router.register(r'demandes-examen', DemandeExamenViewSet, basename='demandes-examen')
router.register(r'certificats', CertificatAptitudeViewSet, basename='certificats')
router.register(r'ordonnances', OrdonnanceViewSet, basename='ordonnances')
router.register(r'fiches-liaison', FicheLiaisonViewSet, basename='fiches-liaison')
# Alias frontend : même API que /api/visites-periodiques/…
router.register(
    r'listes-visites-periodiques',
    ListeVisitePeriodiqueViewSet,
    basename='medical-work-listes-vp',
)
router.register(
    r'lignes-visites-periodiques',
    LigneVisitePeriodiqueViewSet,
    basename='medical-work-lignes-vp',
)

urlpatterns = [
    path('', include(router.urls)),
]
