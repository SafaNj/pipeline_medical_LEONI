from django.db import transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import SiteScopedQuerysetCreateMixin, get_site_save_kwargs_for_serializer, get_site_utilisateur
from apps.act_infirmier.permissions import IsInfirmier
from apps.consultations.permissions import IsInfirmierOrMedecin
from apps.stock.models import ActeInfirmier, MouvementStock, StockMedicament
from apps.stock.serializers import ActeInfirmierSerializer


class ActeInfirmierViewSet(SiteScopedQuerysetCreateMixin, viewsets.ModelViewSet):
    queryset = ActeInfirmier.objects.select_related(
        'collaborateur', 'medicament', 'ligne_ordonnance', 'infirmiere',
    )
    serializer_class = ActeInfirmierSerializer

    def get_permissions(self):
        base_permissions = [MustChangePasswordPermission, IsAuthenticated]
        if self.action == 'create':
            specific_permissions = [IsInfirmier]
        else:
            specific_permissions = [IsInfirmierOrMedecin]
        return [permission() for permission in [*base_permissions, *specific_permissions]]

    def perform_create(self, serializer):
        medicament = serializer.validated_data['medicament']
        quantite   = serializer.validated_data['quantite']
        site = get_site_utilisateur(self.request.user)

        if site is None:
            raise DRFValidationError({'error': 'Site utilisateur introuvable.'})

        with transaction.atomic():
            stock = (
                StockMedicament.objects.select_for_update()
                .filter(medicament=medicament, site=site)
                .order_by('id')
                .first()
            )

            if stock is None or stock.quantite < quantite:
                raise DRFValidationError({'error': 'Stock insuffisant pour ce medicament.'})

            if stock.date_expiration and stock.date_expiration < timezone.now().date():
                raise DRFValidationError({'error': 'Ce medicament est perime.'})

            stock.quantite -= quantite
            stock.save(update_fields=['quantite', 'updated_at'])

            site_kwargs = get_site_save_kwargs_for_serializer(serializer, self.request.user)
            acte = serializer.save(infirmiere=self.request.user, **site_kwargs)

            MouvementStock.objects.create(
                stock=stock,
                type_mouvement=MouvementStock.SORTIE,
                quantite=quantite,
                utilisateur=self.request.user,
                collaborateur=serializer.validated_data.get('collaborateur'),
                motif=serializer.validated_data.get('motif') or None,
                acte=acte,
            )

    @action(detail=False, methods=['get'])
    def by_collaborateur(self, request):
        collaborateur_id = request.query_params.get('collaborateur_id')
        if not collaborateur_id:
            return Response(
                {'error': 'collaborateur_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        actes = self.get_queryset().filter(collaborateur_id=collaborateur_id)
        serializer = self.get_serializer(actes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_ordonnance(self, request):
        ordonnance_id = request.query_params.get('ordonnance_id')
        if not ordonnance_id:
            return Response(
                {'error': 'ordonnance_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        actes = self.get_queryset().filter(ligne_ordonnance__ordonnance_id=ordonnance_id)
        serializer = self.get_serializer(actes, many=True)
        return Response(serializer.data)