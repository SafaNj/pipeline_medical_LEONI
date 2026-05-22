# planning/views/planning_viewsets.py
 
import logging

from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions, BasePermission

from apps.planning.models import ListePassage, ItemPassage
from apps.planning.serializers import (
    ListePassageSerializer,
    ListePassageDetailSerializer,
    ItemPassageSerializer,
)
from apps.planning.sms_service import send_sms, get_last_sms_error
from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import SiteScopedQuerysetCreateMixin
from apps.account.models import Medecin
from apps.act_infirmier.permissions import IsInfirmier

logger = logging.getLogger(__name__)


class IsInfirmierOrModelPermissions(BasePermission):
    """Allow infirmier users or users with Django model permissions."""

    def has_permission(self, request, view):
        if IsInfirmier().has_permission(request, view):
            return True
        return DjangoModelPermissions().has_permission(request, view)


def _send_new_item_notification_if_close(liste, item):
    if liste.statut != ListePassage.STATUS_ACTIVE:
        return

    waiting_items = list(
        ItemPassage.objects.filter(liste=liste, statut=ItemPassage.STATUS_WAITING)
        .order_by('ordre')
    )
    try:
        position = waiting_items.index(item)
    except ValueError:
        return

    collab = item.collaborateur
    if not collab or not getattr(collab, 'telephone', None):
        return

    if position == 0:
        text = "C'est votre tour, rendez-vous à l'infirmerie"
    elif position == 1:
        text = "Votre tour approche bientôt, préparez-vous"
    else:
        return

    send_sms(collab.telephone, text, item=item)


def _as_bool(value):
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().lower() in {'1', 'true', 'yes', 'oui', 'on'}


class ListePassageViewSet(SiteScopedQuerysetCreateMixin, viewsets.ModelViewSet):
    queryset = ListePassage.objects.select_related("medecin").prefetch_related("items")
    serializer_class = ListePassageDetailSerializer
    permission_classes = [
        MustChangePasswordPermission,
        IsAuthenticated,
        DjangoModelPermissions,
    ]

    def get_serializer_class(self):
        if self.action == "list":
            return ListePassageSerializer
        return ListePassageDetailSerializer

    @action(detail=False, methods=["get"])
    def du_jour(self, request):
        """GET liste du jour pour le médecin connecté."""
        try:
            medecin = Medecin.objects.get(profile__user=request.user)
        except Medecin.DoesNotExist:
            return Response(
                {"error": "Utilisateur non reconnu comme médecin."},
                status=status.HTTP_403_FORBIDDEN,
            )
        today = timezone.localdate()
        listes = ListePassage.objects.filter(
            date=today, medecin=medecin
        ).select_related("medecin").prefetch_related("items")
        serializer = ListePassageDetailSerializer(listes, many=True)
        return Response(serializer.data)

    def _send_activation_notifications(self, liste):
        waiting_items = (
            ItemPassage.objects.filter(liste=liste, statut=ItemPassage.STATUS_WAITING)
            .order_by('ordre')
            [:2]
        )
        for idx, candidate in enumerate(waiting_items, start=1):
            collab = candidate.collaborateur
            if not collab or not getattr(collab, 'telephone', None):
                continue
            if idx == 1:
                text = "C'est votre tour, rendez-vous à l'infirmerie"
            else:
                text = "Votre tour approche bientôt, préparez-vous"
            send_sms(collab.telephone, text, item=candidate)

    @action(detail=True, methods=["patch"])
    def activer(self, request, pk=None):
        """PATCH statut → ACTIVE."""
        liste = self.get_object()
        previous_status = liste.statut
        liste.statut = ListePassage.STATUS_ACTIVE
        liste.save(update_fields=["statut", "updated_at"])
        if previous_status == ListePassage.STATUS_PREP:
            self._send_activation_notifications(liste)
        serializer = ListePassageDetailSerializer(liste)
        return Response(serializer.data)

    @action(detail=True, methods=["patch"])
    def terminer(self, request, pk=None):
        """PATCH statut → TERMINEE."""
        liste = self.get_object()
        liste.statut = ListePassage.STATUS_DONE
        liste.save(update_fields=["statut", "updated_at"])
        serializer = ListePassageDetailSerializer(liste)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def ajouter_item(self, request, pk=None):
        """
        POST — ajouter un patient à une liste, même si elle est TERMINEE.
        Si la liste était TERMINEE, elle repasse automatiquement en ACTIVE
        car le médecin est encore disponible pour traiter de nouveaux patients.
        """
        liste = self.get_object()
        previous_status = liste.statut

        data = request.data.copy()
        data["liste"] = liste.id

        serializer = ItemPassageSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        item = serializer.save()

        liste.refresh_from_db()

        # Le signal reopen_liste_if_new_waiting_item gère le passage TERMINEE → ACTIVE,
        # on n'a plus besoin de le faire manuellement ici pour éviter les doubles saves.
        if previous_status == ListePassage.STATUS_ACTIVE:
            # notifie les nouvelles entrées si elles sont aux deux premières positions en attente
            _send_new_item_notification_if_close(liste, item)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"])
    def archives(self, request):
        """
        GET /api/planning/listes/archives/?mois=3&annee=2026
        Retourne toutes les listes d'un mois donné (pour l'infirmier).
        """
        try:
            mois  = int(request.query_params.get("mois",  0))
            annee = int(request.query_params.get("annee", 0))
        except (ValueError, TypeError):
            return Response({"error": "mois et annee sont requis."}, status=status.HTTP_400_BAD_REQUEST)

        if not mois or not annee:
            return Response({"error": "mois et annee sont requis."}, status=status.HTTP_400_BAD_REQUEST)

        listes = (
            self.get_queryset()
            .filter(date__year=annee, date__month=mois)
            .order_by("-date", "session")
        )
        serializer = ListePassageDetailSerializer(listes, many=True)
        return Response(serializer.data)


class ItemPassageViewSet(SiteScopedQuerysetCreateMixin, viewsets.ModelViewSet):
    queryset = ItemPassage.objects.select_related("liste", "collaborateur")
    serializer_class = ItemPassageSerializer
    permission_classes = [
        MustChangePasswordPermission,
        IsAuthenticated,
        DjangoModelPermissions,
    ]

    def get_permissions(self):
        if self.action in {"effectuer", "annuler", "notifier", "supprimer", "destroy", "update", "partial_update"}:
            permission_classes = [
                MustChangePasswordPermission,
                IsAuthenticated,
                IsInfirmierOrModelPermissions,
            ]
            return [permission() for permission in permission_classes]
        return [permission() for permission in self.permission_classes]

    def _send_n_plus_2_notification(self, item):
        waiting_items = list(
            ItemPassage.objects.filter(liste=item.liste, statut=ItemPassage.STATUS_WAITING)
            .order_by('ordre')
        )

        after_current = [i for i in waiting_items if i.ordre and item.ordre and i.ordre > item.ordre]
        if len(after_current) < 2:
            return

        target = after_current[1]

        logger.info(
            'SMS DEBUG N+2: item_effectue id=%s ordre=%s -> cible id=%s ordre=%s statut=%s sms_envoye=%s',
            item.id,
            item.ordre,
            target.id,
            target.ordre,
            target.statut,
            target.sms_envoye,
        )

        collab = target.collaborateur
        if not collab or not getattr(collab, 'telephone', None):
            return

        if target.sms_envoye:
            return

        cancelled_before_target = ItemPassage.objects.filter(
            liste=item.liste,
            ordre__gt=item.ordre,
            ordre__lt=target.ordre,
            statut=ItemPassage.STATUS_CANCELLED,
        ).count()

        if cancelled_before_target:
            text = (
                "Bonjour, votre tour approche bientôt (quelques annulations entre temps), "
                "veuillez vous rendre à l'infirmerie"
            )
        else:
            text = "Bonjour, votre tour approche, veuillez vous rendre à l'infirmerie"

        send_sms(collab.telephone, text, item=target)

    def _send_n_plus_1_notification(self, item):
        waiting_items = list(
            ItemPassage.objects.filter(liste=item.liste, statut=ItemPassage.STATUS_WAITING)
            .order_by('ordre')
        )

        after_current = [i for i in waiting_items if i.ordre and item.ordre and i.ordre > item.ordre]
        if not after_current:
            return

        target = after_current[0]
        logger.info(
            'SMS DEBUG N+1: item_annule id=%s ordre=%s -> cible id=%s ordre=%s statut=%s sms_envoye=%s',
            item.id,
            item.ordre,
            target.id,
            target.ordre,
            target.statut,
            target.sms_envoye,
        )
        collab = target.collaborateur
        if not collab or not getattr(collab, 'telephone', None):
            return

        if target.sms_envoye:
            return

        text = "Votre tour approche bientôt, préparez-vous"
        send_sms(collab.telephone, text, item=target)


    @action(detail=True, methods=["patch"])
    def effectuer(self, request, pk=None):
        """PATCH statut → EFFECTUEE."""
        item = self.get_object()
        item.statut = ItemPassage.STATUS_DONE
        item.save(update_fields=["statut"])
        self._send_n_plus_2_notification(item)
        serializer = ItemPassageSerializer(item)
        return Response(serializer.data)

    @action(detail=True, methods=["post", "patch"])
    def notifier(self, request, pk=None):
        """POST /items/{id}/notifier/ - renvoyer un SMS manuellement."""
        item = self.get_object()
        collab = item.collaborateur
        if not collab or not getattr(collab, 'telephone', None):
            return Response(
                {"error": "Collaborateur ou numéro de téléphone non configuré."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        message = request.data.get(
            'message',
            "Bonjour, votre tour approche, veuillez vous rendre à l'infirmerie",
        )
        marquer_envoye = _as_bool(request.data.get('marquer_envoye', False))
        send_item = item if marquer_envoye else None
        sent = send_sms(collab.telephone, message, item=send_item)
        if not sent:
            error_detail = get_last_sms_error() or 'gateway_unavailable'
            return Response(
                {
                    'error': 'Échec envoi SMS (vérifiez clé API ou numéro).',
                    'detail': error_detail,
                    'sent': False,
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response({'success': 'Notification envoyée', 'sent': True, 'marquer_envoye': marquer_envoye})

    @action(detail=True, methods=["patch"])
    def annuler(self, request, pk=None):
        """PATCH statut → ANNULEE."""
        item = self.get_object()
        item.statut = ItemPassage.STATUS_CANCELLED
        item.save(update_fields=["statut"])

        # Après annulation, on notifie le suivant direct (N+1).
        self._send_n_plus_1_notification(item)

        serializer = ItemPassageSerializer(item)
        return Response(serializer.data)

    @action(detail=True, methods=["delete", "patch"])
    def supprimer(self, request, pk=None):
        """DELETE ou PATCH /items/{id}/supprimer/ - supprimer explicitement un item."""
        item = self.get_object()
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)