from rest_framework import viewsets

from rest_framework.permissions import BasePermission

from apps.account.permissions import (
    IsAnyMedecinOrHSSE,
    IsAuthenticatedOrOptions,
    IsHSSE,
    MustChangePasswordPermission,
)
from apps.account.utils import SiteScopedQuerysetCreateMixin
from apps.act_infirmier.permissions import IsInfirmier
from apps.hsee.models import ParametreHSEEMensuel
from apps.hsee.serializers import ParametreHSEEMensuelSerializer


class IsInfirmierOrHSSE(BasePermission):
    """Saisie des paramètres mensuels depuis le dashboard infirmier ou le dashboard HSSE."""

    def has_permission(self, request, view):
        if IsInfirmier().has_permission(request, view):
            return True
        return IsHSSE().has_permission(request, view)


class ParametreHSEEMensuelViewSet(SiteScopedQuerysetCreateMixin, viewsets.ModelViewSet):
    """
    CRUD paramètres HSEE (heures / effectif) par mois — infirmier ou profil HSSE.
    """

    queryset = ParametreHSEEMensuel.objects.all()
    serializer_class = ParametreHSEEMensuelSerializer

    def get_permissions(self):
        base = [MustChangePasswordPermission, IsAuthenticatedOrOptions]
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            return [p() for p in [*base, IsAnyMedecinOrHSSE]]
        return [p() for p in [*base, IsInfirmierOrHSSE]]
