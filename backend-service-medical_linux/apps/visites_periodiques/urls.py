from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.visites_periodiques.views import (
    ListeVisitePeriodiqueViewSet,
    LigneVisitePeriodiqueViewSet,
)
from apps.visites_periodiques.views.export_vp_view import ExportVisitesPeriodiquesView

router = DefaultRouter()
router.register(
    r"listes-visites-periodiques",
    ListeVisitePeriodiqueViewSet,
    basename="listes-vp",
)
router.register(
    r"lignes-visites-periodiques",
    LigneVisitePeriodiqueViewSet,
    basename="lignes-vp",
)

urlpatterns = router.urls + [
    path('listes/export/', ExportVisitesPeriodiquesView.as_view(), name='export-vp'),
]
