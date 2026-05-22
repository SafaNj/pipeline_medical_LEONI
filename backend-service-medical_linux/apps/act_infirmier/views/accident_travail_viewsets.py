from django.db.models import F, Sum
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.account.permissions import IsHSSE, MustChangePasswordPermission
from apps.account.utils import SiteScopedQuerysetCreateMixin, get_site_save_kwargs_for_serializer
from apps.act_infirmier.models import AccidentTravail, EnqueteAccident
from apps.act_infirmier.permissions import IsInfirmier
from apps.act_infirmier.serializers import AccidentTravailSerializer, EnqueteAccidentSerializer
from apps.consultations.permissions import IsAnyMedecin
from apps.hsee.models import NotificationHSSE


class AccidentTravailViewSet(SiteScopedQuerysetCreateMixin, viewsets.ModelViewSet):
    queryset = AccidentTravail.objects.select_related(
        "collaborateur",
        "infirmiere",
        "enquete",
    )
    serializer_class = AccidentTravailSerializer

    def get_permissions(self):
        base_permissions = [MustChangePasswordPermission, IsAuthenticated]

        if self.action == "enquete":
            if self.request.method in ("POST", "PATCH"):
                specific_permissions = [IsInfirmier]
            else:
                specific_permissions = [IsInfirmier | IsAnyMedecin | IsHSSE]
        elif self.action in ("create", "update", "partial_update", "destroy"):
            # Seul l'infirmier peut créer / modifier / supprimer
            specific_permissions = [IsInfirmier]
        else:
            # Lecture : infirmier OU n'importe quel médecin (traitant, travail, contrôleur)
            specific_permissions = [IsInfirmier | IsAnyMedecin]

        permissions = [*base_permissions, *specific_permissions]
        return [permission() for permission in permissions]

    def perform_create(self, serializer):
        site_kwargs = get_site_save_kwargs_for_serializer(serializer, self.request.user)
        serializer.save(infirmiere=self.request.user, **site_kwargs)

    @action(detail=True, methods=["get", "post", "patch"], url_path="enquete")
    def enquete(self, request, pk=None):
        accident = self.get_object()
        if request.method == "GET":
            try:
                enq = (
                    EnqueteAccident.objects.select_related(
                        "accident",
                        "accident__collaborateur",
                        "redige_par",
                    ).get(accident_id=accident.pk)
                )
            except EnqueteAccident.DoesNotExist:
                return Response(None)
            return Response(EnqueteAccidentSerializer(enq).data)

        if request.method == "POST":
            if EnqueteAccident.objects.filter(accident_id=accident.pk).exists():
                return Response(
                    {"detail": "Une enquête existe déjà pour cet accident."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            serializer = EnqueteAccidentSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            enquete = serializer.save(accident=accident, redige_par=request.user)
            NotificationHSSE.objects.get_or_create(
                enquete=enquete,
                defaults={"accident": accident},
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        # PATCH
        try:
            enq = (
                EnqueteAccident.objects.select_related(
                    "accident",
                    "accident__collaborateur",
                    "redige_par",
                ).get(accident_id=accident.pk)
            )
        except EnqueteAccident.DoesNotExist:
            return Response(
                {"detail": "Aucune enquête à modifier pour cet accident."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = EnqueteAccidentSerializer(enq, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

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
            return Response({"error": "mois and annee parameters are required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            mois = int(mois)
            annee = int(annee)
        except (TypeError, ValueError):
            return Response({"error": "mois and annee must be integers"}, status=status.HTTP_400_BAD_REQUEST)
        if mois < 1 or mois > 12:
            return Response({"error": "mois must be between 1 and 12"}, status=status.HTTP_400_BAD_REQUEST)
        queryset = self.get_queryset().filter(date_accident__year=annee, date_accident__month=mois)
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
            return Response({"error": "annee must be an integer"}, status=status.HTTP_400_BAD_REQUEST)
        queryset = self.get_queryset().filter(date_accident__year=annee)
        total = queryset.count()
        total_jours_perdus = (
            queryset.aggregate(total=Sum(F("repos_initial") + F("prolongation"))).get("total") or 0
        )
        return Response({"annee": annee, "total": total, "total_jours_perdus": total_jours_perdus})