from rest_framework.routers import DefaultRouter
from apps.planning.views import ListePassageViewSet, ItemPassageViewSet

router = DefaultRouter()
router.register(r"listes", ListePassageViewSet, basename="listepassage")
router.register(r"items", ItemPassageViewSet, basename="itempassage")
router.register(r"item-passage", ItemPassageViewSet, basename="itempassage-legacy")

urlpatterns = router.urls
