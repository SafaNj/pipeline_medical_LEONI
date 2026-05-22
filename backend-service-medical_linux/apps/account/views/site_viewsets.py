from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.account.models import Site
from apps.account.serializers import SiteSerializer


class SiteViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Site.objects.all().order_by('nom')
    serializer_class = SiteSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['get'], url_path='print-config')
    def print_config(self, request, pk=None):
        site = self.get_object()

        logo_url = None
        if site.logo:
            logo_url = request.build_absolute_uri(site.logo.url)

        return Response(
            {
                'nom': site.nom,
                'logo_url': logo_url,
                'adresse': site.adresse,
                'telephone': site.telephone,
                'code': site.code,
                'template_key': site.template_key,
            }
        )
