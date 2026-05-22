from .acte_infirmier_serializers import ActeInfirmierSerializer
from .medicament_serializers import MedicamentSerializer
from .mouvement_stock_serializers import MouvementStockSerializer
from .stock_serializers import StockMedicamentSerializer

__all__ = [
    'MedicamentSerializer',
    'StockMedicamentSerializer',
    'ActeInfirmierSerializer',
    'MouvementStockSerializer',
]
