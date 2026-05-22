from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.control_visits.views import (
	ContreVisiteViewSet,
	ControleMedicalViewSet,
	DemandeExpertiseViewSet,
	ListeContreVisiteViewSet,
	LigneContreVisiteViewSet,
)

router = DefaultRouter()
router.register(r'contre-visites', ContreVisiteViewSet, basename='contre-visites')
router.register(r'controles-medicaux', ControleMedicalViewSet, basename='controles-medicaux')
router.register(r'demandes-expertise', DemandeExpertiseViewSet, basename='demandes-expertise')
router.register(r'listes-contre-visites', ListeContreVisiteViewSet, basename='listes-cv')
router.register(r'lignes-contre-visites', LigneContreVisiteViewSet, basename='lignes-cv')

urlpatterns = [
	path('', include(router.urls)),
]