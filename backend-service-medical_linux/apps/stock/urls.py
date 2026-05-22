from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.stock.views import (
    ActeInfirmierViewSet,
    MedicamentViewSet,
    MouvementStockViewSet,
    StockMedicamentViewSet,
)
from apps.stock.views.consommation_courante_view import ConsommationCouranteView
from apps.stock.views.export_stock_view import ExportStockMedicamentsView

router = DefaultRouter()
router.register(r'medicaments', MedicamentViewSet, basename='stock-medicaments')
router.register(r'stocks', StockMedicamentViewSet, basename='stock-stocks')
router.register(r'actes', ActeInfirmierViewSet, basename='stock-actes')
router.register(r'mouvements', MouvementStockViewSet, basename='stock-mouvements')

urlpatterns = [
    path('', include(router.urls)),
    path('consommation-courante/', ConsommationCouranteView.as_view(), name='consommation-courante'),
    path('export-stock/', ExportStockMedicamentsView.as_view(), name='export-stock'),
]