from rest_framework.routers import DefaultRouter
from apps.employees.views import CollaborateurViewSet

router = DefaultRouter()
router.register(r"collaborateurs", CollaborateurViewSet, basename="collaborateur")

urlpatterns = router.urls