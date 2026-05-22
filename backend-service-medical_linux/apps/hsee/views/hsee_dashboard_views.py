from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.account.permissions import (
    IsAnyMedecinOrHSSE,
    IsAuthenticatedOrOptions,
    MustChangePasswordPermission,
)
from apps.account.utils import get_site_utilisateur
from apps.hsee.services.hsee_service import build_hsee_dashboard


class HSEEDashboardView(APIView):
    """
    GET /api/hsee/dashboard/?annee=2026&mois=3
    """

    permission_classes = [
        MustChangePasswordPermission,
        IsAuthenticatedOrOptions,
        IsAnyMedecinOrHSSE,
    ]

    def get(self, request):
        try:
            annee = int(request.query_params.get("annee", ""))
            mois = int(request.query_params.get("mois", ""))
        except (TypeError, ValueError):
            return Response(
                {"detail": "Paramètres annee et mois requis (entiers)."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if mois < 1 or mois > 12:
            return Response(
                {"detail": "mois doit être entre 1 et 12."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Nouveaux filtres optionnels
        filtres = {
            "categorie": request.query_params.get("categorie"),
            "avec_arret": request.query_params.get("avec_arret"),
            "plant_section": request.query_params.get("plant_section"),
            "criticite": request.query_params.get("criticite"),
            "nature_lesion": request.query_params.get("nature_lesion"),
            "lieu": request.query_params.get("lieu"),
            "cause": request.query_params.get("cause"),
            "departement": request.query_params.get("departement"),
        }

        data = build_hsee_dashboard(
            annee, mois,
            site=get_site_utilisateur(request.user),
            filtres=filtres
        )
        return Response(data)
