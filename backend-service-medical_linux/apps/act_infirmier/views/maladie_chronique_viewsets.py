from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import SiteScopedQuerysetCreateMixin
from apps.act_infirmier.models import MaladieChronique
from apps.act_infirmier.permissions import IsInfirmier, IsInfirmierOrAnyMedecin
from apps.act_infirmier.serializers import MaladieChroniquSerializer


class MaladieChroniquViewSet(SiteScopedQuerysetCreateMixin, viewsets.ModelViewSet):
    queryset = MaladieChronique.objects.select_related(
        "collaborateur",
        "infirmiere",
        "infirmiere__profile",
        "infirmiere__profile__user",
    )
    serializer_class = MaladieChroniquSerializer
    def get_permissions(self):
        base = [MustChangePasswordPermission, IsAuthenticated]
        if self.action in ("create", "update", "partial_update", "destroy"):
            # Écriture : infirmier uniquement
            specific = [IsInfirmier]
        else:
            # Lecture : infirmier OU n'importe quel médecin
            specific = [IsInfirmierOrAnyMedecin]
        return [p() for p in (*base, *specific)]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        "collaborateur": ["exact"],
        "segment": ["exact"],
        "type_maladie": ["exact"],
        "date_declaration": ["exact", "year"],
    }
