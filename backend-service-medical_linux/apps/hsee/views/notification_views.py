from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.account.permissions import IsHSSE, MustChangePasswordPermission
from apps.account.utils import SiteScopedQuerysetCreateMixin, get_site_utilisateur
from apps.act_infirmier.models import EnqueteAccident
from apps.act_infirmier.serializers import AccidentTravailSerializer, EnqueteAccidentSerializer
from apps.hsee.models import NotificationHSSE
from apps.hsee.serializers import NotificationHSSESerializer


class NotificationHSSEViewSet(SiteScopedQuerysetCreateMixin, viewsets.ReadOnlyModelViewSet):
    """Lecture et acquittement des notifications d'enquête pour le rôle HSSE."""

    queryset = NotificationHSSE.objects.select_related(
        "accident",
        "accident__collaborateur",
        "accident__infirmiere",
        "enquete",
        "enquete__redige_par",
    )
    serializer_class = NotificationHSSESerializer

    def get_permissions(self):
        permissions = [MustChangePasswordPermission, IsAuthenticated, IsHSSE]
        return [permission() for permission in permissions]

    def get_queryset(self):
        queryset = super().get_queryset()
        lu_param = self.request.query_params.get("lu")
        
        # Par défaut (sans paramètre) : retourner TOUTES les notifications (lues + non lues)
        if lu_param is None:
            return queryset
        
        # Avec paramètre : filtrer selon la valeur
        value = lu_param.strip().lower()
        if value in ("true", "1", "yes"):
            return queryset.filter(lu=True)
        if value in ("false", "0", "no"):
            return queryset.filter(lu=False)
        return queryset

    @action(detail=True, methods=["patch"], url_path="marquer-lu")
    def marquer_lu(self, request, pk=None):
        notification = self.get_object()
        if not notification.lu:
            notification.lu = True
            notification.date_lecture = timezone.now()
            notification.save(update_fields=["lu", "date_lecture"])
        serializer = self.get_serializer(notification)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="compte")
    def compte(self, request):
        count = self.get_queryset().filter(lu=False).count()
        return Response({"non_lues": count}, status=status.HTTP_200_OK)


class HSEEEnqueteDetailAPIView(APIView):
    """Retourne les données complètes accident + enquête pour consultation HSSE."""

    permission_classes = [MustChangePasswordPermission, IsAuthenticated, IsHSSE]

    def get(self, request, accident_id):
        try:
            enquete = EnqueteAccident.objects.select_related(
                "accident",
                "accident__collaborateur",
                "accident__infirmiere",
                "redige_par",
            ).get(accident_id=accident_id)
        except EnqueteAccident.DoesNotExist:
            return Response(
                {"detail": "Aucune enquête trouvée pour cet accident."},
                status=status.HTTP_404_NOT_FOUND,
            )

        site_hsee = get_site_utilisateur(request.user)
        if site_hsee is not None and enquete.accident.site_id != site_hsee.id:
            return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

        return Response(
            {
                "enquete": EnqueteAccidentSerializer(enquete).data,
                "accident": AccidentTravailSerializer(enquete.accident).data,
            },
            status=status.HTTP_200_OK,
        )
