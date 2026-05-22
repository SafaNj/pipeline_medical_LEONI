from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import SiteScopedQuerysetCreateMixin
from apps.consultations.models import CertificatExemption
from apps.consultations.permissions import IsMedecinTraitant
from apps.consultations.serializers import CertificatExemptionSerializer


class CertificatExemptionViewSet(SiteScopedQuerysetCreateMixin, viewsets.ModelViewSet):
    queryset = CertificatExemption.objects.select_related("consultation")
    serializer_class = CertificatExemptionSerializer
    permission_classes = [
        MustChangePasswordPermission,
        IsAuthenticated,
        IsMedecinTraitant,
    ]

    @action(detail=False, methods=["get"])
    def by_consultation(self, request):
        consultation_id = request.query_params.get("consultation_id")
        if not consultation_id:
            return Response(
                {"error": "consultation_id parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        queryset = self.get_queryset().filter(consultation_id=consultation_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
