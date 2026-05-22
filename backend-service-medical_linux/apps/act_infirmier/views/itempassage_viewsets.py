import logging

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.act_infirmier.permissions import IsInfirmier
from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import SiteScopedQuerysetCreateMixin
from apps.planning.models import ItemPassage
from apps.planning.serializers import ItemPassageSerializer
from apps.planning.sms_service import send_sms, get_last_sms_error

logger = logging.getLogger(__name__)


class ItemPassageViewSet(SiteScopedQuerysetCreateMixin, viewsets.ModelViewSet):
    queryset = ItemPassage.objects.select_related("liste", "collaborateur")
    serializer_class = ItemPassageSerializer
    permission_classes = [MustChangePasswordPermission, IsAuthenticated, IsInfirmier]

    http_method_names = ['get', 'post', 'patch', 'delete']

    @staticmethod
    def _as_bool(value):
        if isinstance(value, bool):
            return value
        if value is None:
            return False
        return str(value).strip().lower() in {'1', 'true', 'yes', 'oui', 'on'}

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
            'SMS DEBUG N+2 (act_infirmier): item_effectue id=%s ordre=%s -> cible id=%s ordre=%s statut=%s sms_envoye=%s',
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
            'SMS DEBUG N+1 (act_infirmier): item_annule id=%s ordre=%s -> cible id=%s ordre=%s statut=%s sms_envoye=%s',
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
        item = self.get_object()
        item.statut = ItemPassage.STATUS_DONE
        item.save(update_fields=["statut"])
        self._send_n_plus_2_notification(item)
        return Response(self.get_serializer(item).data)

    @action(detail=True, methods=["patch"])
    def annuler(self, request, pk=None):
        item = self.get_object()
        item.statut = ItemPassage.STATUS_CANCELLED
        item.save(update_fields=["statut"])
        self._send_n_plus_1_notification(item)
        return Response(self.get_serializer(item).data)

    @action(detail=True, methods=["post", "patch"])
    def notifier(self, request, pk=None):
        item = self.get_object()
        collab = item.collaborateur
        if not collab or not getattr(collab, 'telephone', None):
            return Response(
                {'error': 'Collaborateur ou numéro de téléphone non configuré.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        message = request.data.get(
            'message',
            'Bonjour, votre tour approche, veuillez vous rendre à l\'infirmerie',
        )
        marquer_envoye = self._as_bool(request.data.get('marquer_envoye', False))
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

    @action(detail=True, methods=['delete', 'patch'])
    def supprimer(self, request, pk=None):
        item = self.get_object()
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)