from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.account.models import Medecin
from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import SiteScopedQuerysetCreateMixin, get_site_save_kwargs_for_serializer
from apps.consultations.permissions import IsAnyMedecin
from apps.control_visits.models import ContreVisite
from apps.control_visits.permissions import IsMedecinControleur
from apps.control_visits.serializers import ContreVisiteSerializer
from apps.embauche.permissions import IsRH
from apps.planning.models import ListePassage
from apps.planning.serializers import ListePassageDetailSerializer


class ContreVisiteViewSet(SiteScopedQuerysetCreateMixin, viewsets.ModelViewSet):
    queryset = ContreVisite.objects.select_related(
        'item_passage',
        'item_passage__collaborateur',
        'medecin_controleur',
        'medecin_controleur__profile__user',
        'site',
    )
    serializer_class = ContreVisiteSerializer
    pagination_class = None  # La pagination est gérée côté frontend

    def get_permissions(self):
        base = [MustChangePasswordPermission, IsAuthenticated]
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            # Lecture : tout médecin (traitant, travail, contrôleur), infirmier, RH — historique patient partagé
            specific = [IsAnyMedecin | IsRH]
        elif self.request.method == "POST":
            # Création : médecin contrôleur OU RH (qui crée la liste)
            specific = [IsMedecinControleur | IsRH]
        else:
            # Modification/suppression : médecin contrôleur uniquement
            specific = [IsMedecinControleur]
        return [p() for p in (*base, *specific)]

    def perform_create(self, serializer):
        try:
            medecin = Medecin.objects.get(profile__user=self.request.user)
        except Medecin.DoesNotExist:
            medecin = None
        site_kwargs = get_site_save_kwargs_for_serializer(serializer, self.request.user)
        if medecin:
            serializer.save(medecin_controleur=medecin, **site_kwargs)
        else:
            serializer.save(**site_kwargs)

    @action(detail=False, methods=['get'])
    def mes_listes_du_jour(self, request):
        medecin = Medecin.objects.get(profile__user=request.user)
        listes = ListePassage.objects.filter(
            date=timezone.localdate(),
            type_liste=ListePassage.TYPE_CONTRE_VISITE,
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
        matricule = (request.query_params.get('matricule') or '').strip()
        if not matricule:
            return Response(
                {'error': 'matricule parameter is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = self.get_queryset().filter(matricule=matricule)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)