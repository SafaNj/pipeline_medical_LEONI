from .acte_infirmier_viewsets import ActeInfirmierViewSet
from .medicament_viewsets import MedicamentViewSet
from .mouvement_stock_viewsets import MouvementStockViewSet
from .stock_viewsets import StockMedicamentViewSet
from .consommation_courante_view import ConsommationCouranteView

__all__ = [
    'MedicamentViewSet',
    'StockMedicamentViewSet',
    'ActeInfirmierViewSet',
    'MouvementStockViewSet',
    'ConsommationCouranteView',
]