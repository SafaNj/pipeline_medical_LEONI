from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import SiteScopedQuerysetCreateMixin, get_site_save_kwargs_for_serializer
import logging

from apps.act_infirmier.models import OrdreTransport, TransfertUrgence
from apps.act_infirmier.permissions import IsInfirmier
from apps.act_infirmier.serializers import OrdreTransportSerializer
from apps.consultations.permissions import IsInfirmierOrMedecin

logger = logging.getLogger(__name__)


class OrdreTransportViewSet(SiteScopedQuerysetCreateMixin, viewsets.ModelViewSet):
    queryset = OrdreTransport.objects.select_related(
        "transfert__collaborateur",
        "transfert",
        "transfert__site",
        "medecin__profile__user",
        "infirmier",
    )
    serializer_class = OrdreTransportSerializer

    def get_permissions(self):
        base = [MustChangePasswordPermission, IsAuthenticated]
        if self.action in ("create", "update", "partial_update", "destroy"):
            specific = [IsInfirmier]
        else:
            specific = [IsInfirmierOrMedecin]
        return [p() for p in (*base, *specific)]

    def perform_create(self, serializer):
        site_kwargs = get_site_save_kwargs_for_serializer(serializer, self.request.user)
        ordre = serializer.save(infirmier=self.request.user, **site_kwargs)
        # Notification chauffeur : après enregistrement de l’ordre de transport (bon = num_ordre du transfert).
        try:
            from apps.act_infirmier.transfert_urgence_sms import notifier_chauffeur_si_besoin

            transfert = TransfertUrgence.objects.select_related("site").get(pk=ordre.transfert_id)
            notifier_chauffeur_si_besoin(transfert, telephone_avant="")
        except Exception:
            logger.exception(
                "SMS chauffeur après ordre de transport ordre_id=%s transfert_id=%s",
                getattr(ordre, "pk", None),
                getattr(ordre, "transfert_id", None),
            )

    # ── Filtrer par date ───────────────────────────────
    @action(detail=False, methods=["get"])
    def by_date(self, request):
        date = request.query_params.get("date")
        if not date:
            return Response(
                {"error": "Paramètre 'date' requis."},
                status=status.HTTP_400_BAD_REQUEST
            )
        qs = self.get_queryset().filter(transfert__date=date)
        return Response(self.get_serializer(qs, many=True).data)

    # ── Filtrer par collaborateur ──────────────────────
    @action(detail=False, methods=["get"])
    def by_collaborateur(self, request):
        collab_id = request.query_params.get("collaborateur_id")
        if not collab_id:
            return Response(
                {"error": "Paramètre 'collaborateur_id' requis."},
                status=status.HTTP_400_BAD_REQUEST
            )
        qs = self.get_queryset().filter(transfert__collaborateur_id=collab_id)
        return Response(self.get_serializer(qs, many=True).data)

    # ── Stats par mois ─────────────────────────────────
    @action(detail=False, methods=["get"])
    def stats(self, request):
        from django.db.models import Count, Sum
        from django.utils import timezone

        mois  = request.query_params.get("mois")
        annee = request.query_params.get("annee")

        if not annee:
            annee = timezone.localdate().year
        try:
            annee = int(annee)
            if mois:
                mois = int(mois)
        except (TypeError, ValueError):
            return Response(
                {"error": "mois et annee doivent être des entiers."},
                status=status.HTTP_400_BAD_REQUEST
            )

        qs = self.get_queryset().filter(transfert__date__year=annee)
        if mois:
            qs = qs.filter(transfert__date__month=mois)

        total         = qs.count()
        total_prime   = qs.aggregate(s=Sum("montant_prime"))["s"] or 0
        par_mois      = list(
            qs.values("transfert__date__month")
            .annotate(total=Count("id"), total_prime=Sum("montant_prime"))
            .order_by("transfert__date__month")
        )

        return Response({
            "annee":       annee,
            "mois":        mois,
            "total":       total,
            "total_prime": total_prime,
            "par_mois":    par_mois,
        })
