# apps/stock/views/medicament_viewsets.py
from rest_framework import filters, viewsets
from rest_framework.permissions import IsAuthenticated

from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import SiteScopedQuerysetCreateMixin
from apps.act_infirmier.permissions import IsInfirmier
from apps.consultations.permissions import IsInfirmierOrMedecin
from apps.stock.models import Medicament
from apps.stock.serializers import MedicamentSerializer


class MedicamentViewSet(SiteScopedQuerysetCreateMixin, viewsets.ModelViewSet):
    queryset = Medicament.objects.prefetch_related('stocks').all()
    serializer_class = MedicamentSerializer

    # ← Active GET /stock/medicaments/?search=doliprane
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ['nom', 'dosage']
    ordering_fields  = ['nom', 'created_at']
    ordering         = ['nom']

    def get_permissions(self):
        base = [MustChangePasswordPermission, IsAuthenticated]
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            specific = [IsInfirmier]
        else:
            specific = [IsInfirmierOrMedecin]
        return [p() for p in [*base, *specific]]