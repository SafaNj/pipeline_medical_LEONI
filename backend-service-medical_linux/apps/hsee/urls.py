from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.hsee.views import (
    HSEEDashboardView,
    HSEEEnqueteDetailAPIView,
    NotificationHSSEViewSet,
    ParametreHSEEMensuelViewSet,
)
from apps.hsee.views.hsee_export_views import (
    HSEEMedecinsActiviteExportView,
    HSEEMedecinsPourExportView,
)

router = DefaultRouter()
router.register(r"parametres-mensuels", ParametreHSEEMensuelViewSet, basename="hsee-parametres")
router.register(r"notifications", NotificationHSSEViewSet, basename="hsee-notifications")

urlpatterns = [
    path("dashboard/", HSEEDashboardView.as_view(), name="hsee-dashboard"),
    path(
        "medecins-pour-export/",
        HSEEMedecinsPourExportView.as_view(),
        name="hsee-medecins-pour-export",
    ),
    path(
        "exports/medecins-activite/",
        HSEEMedecinsActiviteExportView.as_view(),
        name="hsee-export-medecins-activite",
    ),
    path("enquetes/<int:accident_id>/", HSEEEnqueteDetailAPIView.as_view(), name="hsee-enquete-detail"),
    path("", include(router.urls)),
]
