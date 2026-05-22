from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.surveillance_speciale.views import (
    LigneSurveillanceSpecialeViewSet,
    ListeSurveillanceSpecialeViewSet,
)

router = DefaultRouter()
router.register(
    r"listes-surveillance-speciale",
    ListeSurveillanceSpecialeViewSet,
    basename="surveillance-speciale-listes",
)
router.register(
    r"lignes-surveillance-speciale",
    LigneSurveillanceSpecialeViewSet,
    basename="surveillance-speciale-lignes",
)

urlpatterns = [
    path("", include(router.urls)),
]
