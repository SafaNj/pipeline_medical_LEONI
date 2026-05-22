from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import SiteScopedQuerysetCreateMixin
from apps.consultations.permissions import IsInfirmierOrMedecin
from apps.employees.models import Collaborateur
from apps.stock.models import MouvementStock
from apps.stock.serializers import MouvementStockSerializer


class MouvementStockViewSet(SiteScopedQuerysetCreateMixin, viewsets.ReadOnlyModelViewSet):
    queryset = MouvementStock.objects.select_related(
        'stock__medicament',
        'utilisateur',
        'acte',
        'collaborateur',          # ← nouveau
    )
    serializer_class = MouvementStockSerializer
    permission_classes = [
        MustChangePasswordPermission,
        IsAuthenticated,
        IsInfirmierOrMedecin,
    ]

    def _build_collaborateur_payload(self, collaborateur):
        try:
            nom = (collaborateur.nom or '').strip()
            prenom = (collaborateur.prenom or '').strip()
            poste = (collaborateur.poste or '').strip()
            department = (collaborateur.department or '').strip()
        except Exception:
            nom = ''
            prenom = ''
            poste = ''
            department = ''

        display_name = f"{nom} {prenom}".strip() or f"Matricule {collaborateur.matricule}"
        im_data_available = any([nom, prenom, poste, department])

        return {
            'id': collaborateur.id,
            'matricule': collaborateur.matricule,
            'nom': nom,
            'prenom': prenom,
            'poste': poste,
            'department': department,
            'display_name': display_name,
            'im_data_available': im_data_available,
        }

    @action(detail=False, methods=['get'])
    def by_medicament(self, request):
        medicament_id = request.query_params.get('medicament_id')
        if not medicament_id:
            return Response({'error': 'medicament_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        qs = self.get_queryset().filter(stock__medicament_id=medicament_id)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_collaborateur(self, request):
        """
        GET /api/stock/mouvements/by_collaborateur/?matricule=12345
        Retourne tous les mouvements SORTIE pour ce collaborateur
        avec cumul par médicament calculé ici.
        """
        matricule = request.query_params.get('matricule', '').strip()
        if not matricule:
            return Response(
                {'error': 'Le paramètre matricule est obligatoire.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            collaborateur = Collaborateur.objects.get(matricule=matricule)
        except Collaborateur.DoesNotExist:
            return Response(
                {'error': f'Aucun collaborateur avec le matricule « {matricule} ».'},
                status=status.HTTP_404_NOT_FOUND,
            )

        qs = (
            self.get_queryset()
            .filter(collaborateur=collaborateur, type_mouvement=MouvementStock.SORTIE)
            .order_by('-date_mouvement')
        )

        # ── Historique détaillé ──────────────────────────────────────────────
        historique = [
            {
                'id':           m.id,
                'date':         m.date_mouvement.strftime('%d/%m/%Y %H:%M'),
                'medicament':   m.stock.medicament.nom,
                'dosage':       m.stock.medicament.dosage,
                'unite':        m.stock.medicament.get_unite_display(),
                'quantite':     m.quantite,
                'motif':        m.motif or '',
                'infirmier':    m.utilisateur.get_full_name() or m.utilisateur.username,
            }
            for m in qs
        ]

        # ── Cumul par médicament ─────────────────────────────────────────────
        cumuls = {}
        for m in qs:
            key = m.stock.medicament_id
            if key not in cumuls:
                cumuls[key] = {
                    'medicament_id': key,
                    'medicament':    m.stock.medicament.nom,
                    'dosage':        m.stock.medicament.dosage,
                    'total':         0,
                }
            cumuls[key]['total'] += m.quantite

        return Response({
            'collaborateur': self._build_collaborateur_payload(collaborateur),
            'total_dispensations': len(historique),
            'cumuls_par_medicament': sorted(cumuls.values(), key=lambda x: x['total'], reverse=True),
            'historique': historique,
        })