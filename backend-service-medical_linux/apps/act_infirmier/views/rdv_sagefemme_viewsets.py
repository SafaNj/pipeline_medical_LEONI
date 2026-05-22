from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import SiteScopedQuerysetCreateMixin
from apps.act_infirmier.models import RendezVousSagefemme
from apps.act_infirmier.permissions import IsInfirmier
from apps.act_infirmier.serializers import RendezVousSagefemmeSerializer


class RendezVousSagefemmeViewSet(SiteScopedQuerysetCreateMixin, viewsets.ModelViewSet):
    queryset = RendezVousSagefemme.objects.select_related("collaborateur", "infirmiere", "site")
    serializer_class = RendezVousSagefemmeSerializer
    permission_classes = [MustChangePasswordPermission, IsAuthenticated, IsInfirmier]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["collaborateur", "segment", "secteur_collaborateur", "site", "date_rdv"]
