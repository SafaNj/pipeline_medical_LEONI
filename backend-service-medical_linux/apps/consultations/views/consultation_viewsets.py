from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.account.models import Medecin
from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import SiteScopedQuerysetCreateMixin, get_site_save_kwargs_for_serializer
from apps.consultations.models import Consultation
from apps.consultations.permissions import IsAnyMedecin, IsMedecinTraitant
from apps.consultations.serializers import ConsultationSerializer
from apps.planning.models import ListePassage
from apps.planning.serializers import ListePassageDetailSerializer


class ConsultationViewSet(SiteScopedQuerysetCreateMixin, viewsets.ModelViewSet):
    queryset = Consultation.objects.select_related(
        'medecin',
        'site',
        'item_passage',
        'item_passage__collaborateur',
    ).prefetch_related(
        'ordonnances',
        'certificats',
    )
    serializer_class = ConsultationSerializer

    def get_permissions(self):
        base_permissions = [MustChangePasswordPermission, IsAuthenticated]

        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            # Seul le médecin traitant peut créer / modifier / supprimer
            specific_permissions = [IsMedecinTraitant]
        else:
            # Lecture : n'importe quel médecin (traitant, travail, contrôleur)
            specific_permissions = [IsAnyMedecin]

        permissions = [*base_permissions, *specific_permissions]
        return [permission() for permission in permissions]

    def perform_create(self, serializer):
        medecin = Medecin.objects.get(profile__user=self.request.user)
        site_kwargs = get_site_save_kwargs_for_serializer(serializer, self.request.user)
        serializer.save(medecin=medecin, **site_kwargs)

    @action(detail=False, methods=['get'])
    def mes_consultations(self, request):
        medecin = Medecin.objects.get(profile__user=request.user)
        consultations = self.get_queryset().filter(medecin=medecin)
        serializer = self.get_serializer(consultations, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def mes_listes_du_jour(self, request):
        medecin = Medecin.objects.get(profile__user=request.user)
        listes = ListePassage.objects.filter(
            date=timezone.localdate(),
            type_liste=ListePassage.TYPE_CONSULTATION,
            medecin=medecin,
            statut__in=[
                ListePassage.STATUS_ACTIVE,
                ListePassage.STATUS_PREP,
            ],
        ).select_related('medecin').prefetch_related('items')
        serializer = ListePassageDetailSerializer(listes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_collaborateur(self, request):
        collaborateur_id = request.query_params.get('collaborateur_id')
        if not collaborateur_id:
            return Response(
                {'error': 'collaborateur_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        consultations = self.get_queryset().filter(
            item_passage__collaborateur_id=collaborateur_id
        )
        serializer = self.get_serializer(consultations, many=True)
        return Response(serializer.data)