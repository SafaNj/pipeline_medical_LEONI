import logging

from django.db.models import Count
from django.db.models.functions import ExtractMonth
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import SiteScopedQuerysetCreateMixin, get_site_save_kwargs_for_serializer
from apps.act_infirmier.models import TransfertUrgence
from apps.act_infirmier.permissions import IsInfirmier
from apps.act_infirmier.serializers import TransfertUrgenceSerializer
from apps.consultations.permissions import IsInfirmierOrMedecin

logger = logging.getLogger(__name__)


class TransfertUrgenceViewSet(SiteScopedQuerysetCreateMixin, viewsets.ModelViewSet):
    queryset = TransfertUrgence.objects.select_related(
        "site",
        "collaborateur",
        "infirmiere",
        "ordre_transport",
        "ordre_transport__medecin__profile__user",
        "ordre_transport__infirmier",
    )
    serializer_class = TransfertUrgenceSerializer

    def get_permissions(self):
        base_permissions = [MustChangePasswordPermission, IsAuthenticated]

        if self.action in ("create", "update", "partial_update", "destroy"):
            specific_permissions = [IsInfirmier]
        else:
            specific_permissions = [IsInfirmierOrMedecin]

        return [p() for p in (*base_permissions, *specific_permissions)]

    def perform_create(self, serializer):
        """Pas de SMS ici : le chauffeur est notifié après saisie de l’ordre de transport."""
        site_kwargs = get_site_save_kwargs_for_serializer(serializer, self.request.user)
        serializer.save(infirmiere=self.request.user, **site_kwargs)

    def perform_update(self, serializer):
        """
        SMS uniquement si un ordre de transport existe déjà (ex. téléphone chauffeur saisi après l’ordre).
        """
        telephone_avant = (serializer.instance.telephone_chauffeur or "").strip()
        instance = serializer.save()
        try:
            from apps.act_infirmier.models import OrdreTransport
            from apps.act_infirmier.transfert_urgence_sms import notifier_chauffeur_si_besoin

            if OrdreTransport.objects.filter(transfert_id=instance.pk).exists():
                notifier_chauffeur_si_besoin(instance, telephone_avant=telephone_avant)
        except Exception:
            logger.exception("SMS chauffeur transfert urgence (mise à jour) transfert_id=%s", instance.pk)

    @action(detail=False, methods=["get"])
    def by_collaborateur(self, request):
        collaborateur_id = request.query_params.get("collaborateur_id")
        if not collaborateur_id:
            return Response(
                {"error": "collaborateur_id parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = self.get_queryset().filter(collaborateur_id=collaborateur_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def by_mois(self, request):
        mois = request.query_params.get("mois")
        annee = request.query_params.get("annee")

        if not mois or not annee:
            return Response(
                {"error": "mois and annee parameters are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            mois = int(mois)
            annee = int(annee)
        except (TypeError, ValueError):
            return Response(
                {"error": "mois and annee must be integers"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if mois < 1 or mois > 12:
            return Response(
                {"error": "mois must be between 1 and 12"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = self.get_queryset().filter(date__year=annee, date__month=mois)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        annee = request.query_params.get("annee")
        if annee is None:
            annee = timezone.localdate().year

        try:
            annee = int(annee)
        except (TypeError, ValueError):
            return Response(
                {"error": "annee must be an integer"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = self.get_queryset().filter(date__year=annee)

        total = qs.count()
        par_plant = list(
            qs.values("plant").annotate(total=Count("id")).order_by("-total")
        )
        par_destination = list(
            qs.values("destination").annotate(total=Count("id")).order_by("-total")
        )
        par_mois = list(
            qs.annotate(mois=ExtractMonth("date"))
            .values("mois")
            .annotate(total=Count("id"))
            .order_by("mois")
        )

        return Response(
            {
                "annee": annee,
                "total": total,
                "par_plant": par_plant,
                "par_destination": par_destination,
                "par_mois": par_mois,
            }
        )