# apps/consultations/views/ligne_ordonnance_viewsets.py
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import filter_queryset_by_user_site
from apps.act_infirmier.permissions import IsInfirmier
from apps.consultations.models import LigneOrdonnance
from apps.consultations.permissions import IsInfirmierOrMedecin, IsMedecinTraitant
from apps.consultations.serializers import LigneOrdonnanceSerializer
from apps.stock.models import ActeInfirmier, MouvementStock, StockMedicament


class LigneOrdonnanceViewSet(viewsets.ModelViewSet):
    serializer_class = LigneOrdonnanceSerializer

    def get_queryset(self):
        qs = LigneOrdonnance.objects.select_related(
            'ordonnance',
            'ordonnance__consultation',
            'ordonnance__consultation__medecin',
            'ordonnance__consultation__medecin__profile',
            'ordonnance__consultation__medecin__profile__user',
            'ordonnance__consultation__item_passage',
            'ordonnance__consultation__item_passage__collaborateur',
            'medicament',
        ).prefetch_related('medicament__stocks')

        if statut := self.request.query_params.get('statut'):
            qs = qs.filter(statut=statut)
        if ord_id := self.request.query_params.get('ordonnance_id'):
            qs = qs.filter(ordonnance_id=ord_id)
        return filter_queryset_by_user_site(qs, self.request.user)

    def get_permissions(self):
        base = [MustChangePasswordPermission, IsAuthenticated]
        if self.action in ('donner', 'ignorer'):
            specific = [IsInfirmier]
        elif self.action in ('create', 'update', 'partial_update', 'destroy'):
            specific = [IsMedecinTraitant]
        else:
            specific = [IsInfirmierOrMedecin]
        return [p() for p in [*base, *specific]]

    # ── DONNER ──────────────────────────────────────────────────────
    @action(detail=True, methods=['post'])
    def donner(self, request, pk=None):
        ligne = self.get_object()

        if ligne.statut != LigneOrdonnance.STATUT_EN_ATTENTE:
            return Response({'error': 'Ligne déjà traitée.'}, status=status.HTTP_400_BAD_REQUEST)

        if not ligne.medicament_id:
            return Response(
                {'error': "Médicament non lié au stock. Utilisez 'Ignorer' pour clôturer cette ligne."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            quantite = int(request.data.get('quantite', 1))
            if quantite <= 0:
                raise ValueError()
        except (TypeError, ValueError):
            return Response({'error': 'Quantité invalide.'}, status=status.HTTP_400_BAD_REQUEST)

        collaborateur = ligne.ordonnance.consultation.collaborateur
        if not collaborateur:
            return Response({'error': 'Collaborateur introuvable.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            stock = (
                StockMedicament.objects
                .select_for_update()
                .filter(medicament_id=ligne.medicament_id)
                .order_by('id').first()
            )
            if not stock or stock.quantite < quantite:
                dispo = stock.quantite if stock else 0
                return Response(
                    {'error': f'Stock insuffisant. Disponible : {dispo}'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if stock.date_expiration and stock.date_expiration < timezone.now().date():
                return Response({'error': 'Médicament périmé.'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                # Motif lisible : nom du medecin prescripteur + date de consultation
                try:
                    medecin = ligne.ordonnance.consultation.medecin
                    nom_medecin = medecin.profile.user.get_full_name() or medecin.profile.user.username
                    date_consult = ligne.ordonnance.consultation.date_consultation
                    date_str = date_consult.strftime('%d/%m/%Y') if date_consult else ''
                    motif_dispensation = f'Prescrit par Dr {nom_medecin}' + (f' le {date_str}' if date_str else '')
                except Exception:
                    motif_dispensation = 'Dispensation sur ordonnance'

                acte = ActeInfirmier.objects.create(
                    collaborateur=collaborateur,
                    medicament=ligne.medicament,
                    quantite=quantite,
                    motif=motif_dispensation,
                    ligne_ordonnance=ligne,
                    infirmiere=request.user,
                )
                stock.quantite -= quantite
                stock.save(update_fields=['quantite', 'updated_at'])
                MouvementStock.objects.create(
                    stock=stock,
                    type_mouvement=MouvementStock.SORTIE,
                    quantite=quantite,
                    utilisateur=request.user,
                    collaborateur=collaborateur,
                    motif=motif_dispensation,
                    acte=acte,
                )
            except ValidationError as exc:
                return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

            ligne.statut = LigneOrdonnance.STATUT_DONNEE
            ligne.save(update_fields=['statut'])

        return Response(self.get_serializer(ligne).data)

    # ── IGNORER ─────────────────────────────────────────────────────
    @action(detail=True, methods=['post'])
    def ignorer(self, request, pk=None):
        ligne = self.get_object()
        if ligne.statut != LigneOrdonnance.STATUT_EN_ATTENTE:
            return Response({'error': 'Ligne déjà traitée.'}, status=status.HTTP_400_BAD_REQUEST)
        ligne.statut = LigneOrdonnance.STATUT_IGNORE
        ligne.save(update_fields=['statut'])
        return Response(self.get_serializer(ligne).data)

    # ── BY_ORDONNANCE ────────────────────────────────────────────────
    @action(detail=False, methods=['get'])
    def by_ordonnance(self, request):
        oid = request.query_params.get('ordonnance_id')
        if not oid:
            return Response({'error': 'ordonnance_id requis'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(self.get_serializer(
            self.get_queryset().filter(ordonnance_id=oid), many=True
        ).data)