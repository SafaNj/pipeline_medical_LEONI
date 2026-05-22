from django.db.models import Count
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import filter_queryset_by_user_site
from apps.consultations.models import LigneOrdonnance, PosologieStandard
from apps.consultations.permissions import IsInfirmierOrMedecin
from apps.stock.models import Medicament


class PosologieViewSet(viewsets.GenericViewSet):

    permission_classes = [MustChangePasswordPermission, IsAuthenticated, IsInfirmierOrMedecin]

    @action(detail=False, methods=['get'], url_path='suggest')
    def suggest(self, request):
        medicament_id = request.query_params.get('medicament_id')
        q             = request.query_params.get('q', '').strip()
        limit         = 8

        if not medicament_id:
            return Response({'error': 'medicament_id requis'}, status=status.HTTP_400_BAD_REQUEST)

        # ── Récupérer le préfixe médicament (pour extraire la posologie) ──
        med_prefix = ''
        try:
            med = Medicament.objects.get(pk=medicament_id)
            med_prefix = ' '.join(filter(None, [med.nom, med.dosage])).lower()
        except Medicament.DoesNotExist:
            pass

        def extract_posologie(texte):
            """
            "paracetamole 500mg 2 fois par jour" → "2 fois par jour"
            """
            t = texte.strip()
            if med_prefix:
                t_lower = t.lower()
                if t_lower.startswith(med_prefix):
                    return t[len(med_prefix):].strip()
            # Fallback : après les 2 premiers mots (nom dosage)
            parts = t.split(' ', 2)
            return parts[2] if len(parts) >= 3 else t

        # ── 1. Historique du médecin pour ce médicament ──
        qs = (
            LigneOrdonnance.objects
            .filter(
                medicament_id=medicament_id,
                ordonnance__consultation__medecin__profile__user=request.user,
            )
            .exclude(texte='')
        )
        qs = filter_queryset_by_user_site(qs, request.user)

        if q:
            qs = qs.filter(texte__icontains=q)

        historique = (
            qs
            .values('texte')
            .annotate(count=Count('id'))
            .order_by('-count')[:limit]
        )

        results = [
            {
                'texte':     item['texte'],
                'posologie': extract_posologie(item['texte']),
                'source':    'historique',
                'count':     item['count'],
            }
            for item in historique
        ]

        # ── 2. Posologies standard si historique insuffisant ──
        if len(results) < 5:
            std_qs = PosologieStandard.objects.filter(actif=True)
            if q:
                std_qs = std_qs.filter(texte__icontains=q)

            textes_histo = {r['texte'] for r in results}
            std_qs = std_qs.exclude(texte__in=textes_histo).order_by('ordre')
            std_qs = std_qs[:limit - len(results)]

            results += [
                {
                    'texte':     p.texte,
                    'posologie': p.texte,
                    'source':    'standard',
                    'count':     0,
                }
                for p in std_qs
            ]

        return Response(results, status=status.HTTP_200_OK)