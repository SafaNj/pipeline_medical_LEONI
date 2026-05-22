from datetime import timedelta

from django.db import transaction
from django.db import models as db_models
from django.db.models import F
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import SiteScopedQuerysetCreateMixin
from apps.act_infirmier.permissions import IsInfirmier
from apps.consultations.permissions import IsInfirmierOrMedecin
from apps.stock.models import MouvementStock, StockMedicament
from apps.stock.serializers import StockMedicamentSerializer


class StockMedicamentViewSet(SiteScopedQuerysetCreateMixin, viewsets.ModelViewSet):
    queryset = StockMedicament.objects.select_related('medicament')
    serializer_class = StockMedicamentSerializer

    def get_permissions(self):
        base_permissions = [MustChangePasswordPermission, IsAuthenticated]
        if self.action in ('create', 'update', 'partial_update', 'destroy', 'entree'):
            specific_permissions = [IsInfirmier]
        else:
            specific_permissions = [IsInfirmierOrMedecin]
        return [permission() for permission in [*base_permissions, *specific_permissions]]

    @action(detail=False, methods=['get'])
    def alertes(self, request):
        dans_30_jours = timezone.now().date() + timedelta(days=30)
        qs = self.get_queryset().filter(
            db_models.Q(quantite__lte=F('seuil_alerte'))
            | db_models.Q(date_expiration__lte=dans_30_jours, date_expiration__isnull=False)
        )
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def entree(self, request):
        stock_id = request.data.get('stock_id')

        # Le frontend envoie toujours quantite = nb_boites × qte_par_conditionnement (unités réelles)
        quantite_raw = request.data.get('quantite')

        if stock_id is None or quantite_raw is None:
            return Response(
                {'error': 'stock_id et quantite sont requis'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            quantite = int(quantite_raw)
        except (TypeError, ValueError):
            return Response(
                {'error': 'quantite doit être un entier'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if quantite <= 0:
            return Response(
                {'error': 'quantite doit être supérieure à 0'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            stock = self.get_queryset().select_for_update().filter(pk=stock_id).first()
            if stock is None:
                return Response(
                    {'error': 'Stock introuvable'},
                    status=status.HTTP_404_NOT_FOUND,
                )

            stock.quantite += quantite  # quantite = unités réelles (comprimés/gélules/…)

            # FIX : updated_at est auto_now=True, Django le met à jour
            # automatiquement à chaque save(). L'inclure dans update_fields
            # lève une ValueError → c'était la cause du 500.
            stock.save(update_fields=['quantite'])

            # Mettre à jour date_expiration si fournie
            date_expiration = request.data.get('date_expiration')
            if date_expiration:
                try:
                    StockMedicament.objects.filter(pk=stock_id).update(
                        date_expiration=date_expiration
                    )
                    stock.refresh_from_db()
                except Exception:
                    pass  # date invalide ignorée

            MouvementStock.objects.create(
                stock=stock,
                type_mouvement=MouvementStock.ENTREE,
                quantite=quantite,
                utilisateur=request.user,
                motif=request.data.get('motif', ''),
            )

        serializer = self.get_serializer(stock)
        return Response(serializer.data, status=status.HTTP_200_OK)