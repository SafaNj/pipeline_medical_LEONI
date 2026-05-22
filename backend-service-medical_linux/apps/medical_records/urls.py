from rest_framework.routers import DefaultRouter
from apps.medical_records.views import DossierMedicalViewSet

router = DefaultRouter()
router.register(r"dossiers", DossierMedicalViewSet, basename="dossier-medical")

urlpatterns = router.urls