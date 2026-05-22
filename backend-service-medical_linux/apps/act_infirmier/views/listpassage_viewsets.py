from django.utils import timezone
from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.account.permissions import IsAnyMedecinOrHSSE, MustChangePasswordPermission
from apps.account.utils import SiteScopedQuerysetCreateMixin, get_site_utilisateur
from apps.act_infirmier.permissions import IsInfirmier
from apps.planning.models import ItemPassage, ListePassage
from apps.planning.serializers import (
    ItemPassageSerializer,
    ListePassageDetailSerializer,
    ListePassageSerializer,
)
from apps.planning.sms_service import send_sms
from apps.account.models import Medecin


class InfirmierListeViewSet(SiteScopedQuerysetCreateMixin, viewsets.ModelViewSet):
    queryset = ListePassage.objects.select_related("medecin").prefetch_related("items")
    serializer_class = ListePassageDetailSerializer
    permission_classes = [
        MustChangePasswordPermission,
        IsAuthenticated,
        IsInfirmier,
    ]

    def get_permissions(self):
        base = [MustChangePasswordPermission, IsAuthenticated]
        if getattr(self, "action", None) == "medecins_disponibles":
            return [p() for p in (*base, IsAnyMedecinOrHSSE)]
        return [p() for p in (*base, IsInfirmier)]

    def get_serializer_class(self):
        if self.action == "list":
            return ListePassageSerializer
        return ListePassageDetailSerializer

    def list(self, request, *args, **kwargs):
        today = timezone.localdate()
        queryset = self.get_queryset().filter(date=today)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def ajouter_item(self, request, pk=None):
        liste = self.get_object()

        if liste.statut == ListePassage.STATUS_DONE:
            return Response(
                {"error": "Impossible d'ajouter un item à une liste terminée."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = request.data.copy()
        data["liste"] = liste.id

        serializer = ItemPassageSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

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
        liste = self.get_object()
        liste.statut = ListePassage.STATUS_DONE
        liste.save(update_fields=["statut", "updated_at"])
        serializer = ListePassageDetailSerializer(liste)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def medecins_disponibles(self, request):
        """
        GET /api/act-infirmier/listes/medecins_disponibles/?type_liste=CONSULTATION
        Retourne les médecins selon le type de liste :
          - CONSULTATION    → med_type.name contient 'traitant'
          - CONTRE_VISITE   → med_type.name contient 'controleur'
        """
        type_liste = request.query_params.get("type_liste", "")
        user_site = get_site_utilisateur(request.user)

        medecins = Medecin.objects.select_related("profile__user", "med_type")
        if user_site is not None:
            medecins = medecins.filter(site=user_site)

        if type_liste == ListePassage.TYPE_CONSULTATION:
            medecins = medecins.filter(med_type__name__icontains="traitant")
        elif type_liste == ListePassage.TYPE_CONTRE_VISITE:
            medecins = medecins.filter(
                Q(med_type__name__icontains="controleur")
                | Q(med_type__name__icontains="contrôleur")
                | Q(med_type__name__icontains="control")
            )
        else:
            return Response(
                {"error": "type_liste doit être CONSULTATION ou CONTRE_VISITE"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = [
            {
                "id": m.id,
                "nom_complet": (
                    f"Dr. {m.profile.user.first_name} {m.profile.user.last_name}".strip()
                    if (m.profile.user.first_name or m.profile.user.last_name)
                    else f"Dr. {m.profile.user.username}"
                ),
                "username": m.profile.user.username,
                "specialite": m.specialite,
                "med_type": m.med_type.name if m.med_type else "",
            }
            for m in medecins
        ]
        return Response(data)

    @action(detail=True, methods=["post"])
    def notifier_item(self, request, pk=None):
        liste = self.get_object()
        item_id = request.data.get("item_id")
        if not item_id:
            return Response(
                {"error": "item_id requis"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            item = ItemPassage.objects.get(pk=item_id, liste=liste)
        except ItemPassage.DoesNotExist:
            return Response(
                {"error": "Item non trouvé pour cette liste"},
                status=status.HTTP_404_NOT_FOUND,
            )

        collaborateur = item.collaborateur
        if not collaborateur or not getattr(collaborateur, "telephone", None):
            return Response(
                {"error": "Collaborateur ou téléphone manquant"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        sent = send_sms(
            collaborateur.telephone,
            "Bonjour, votre tour approche, veuillez vous rendre à l'infirmerie",
            item=item,
        )

        if not sent:
            return Response(
                {
                    "error": "Échec envoi SMS (vérifiez clé API ou numéro).",
                    "sent": False,
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({"status": "Notification envoyée", "sent": True})

    @action(detail=False, methods=["get"])
    def dashboard(self, request):
        today = timezone.localdate()
        listes = self.get_queryset().filter(date=today)
        items = ItemPassage.objects.filter(liste__date=today)

        data = {
            "total_listes": listes.count(),
            "total_items_en_attente": items.filter(statut=ItemPassage.STATUS_WAITING).count(),
            "total_effectues": items.filter(statut=ItemPassage.STATUS_DONE).count(),
            "total_annules": items.filter(statut=ItemPassage.STATUS_CANCELLED).count(),
        }
        return Response(data)