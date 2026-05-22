# apps/stock/views/consommation_courante_view.py
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import get_site_utilisateur
from apps.act_infirmier.permissions import IsInfirmier
from apps.employees.models import Collaborateur
from apps.stock.models import ActeInfirmier, MouvementStock, StockMedicament


def _safe_collaborateur_display(collaborateur):
    if not collaborateur:
        return ""

    try:
        nom = (collaborateur.nom or "").strip()
        prenom = (collaborateur.prenom or "").strip()
    except Exception:
        nom = ""
        prenom = ""

    full_name = f"{nom} {prenom}".strip()
    return full_name or f"matricule {collaborateur.matricule}"


class ConsommationCouranteView(APIView):
    """
    POST /api/stock/consommation-courante/

    Sans matricule : sortie anonyme
    Avec matricule : sortie nominative -> ActeInfirmier TYPE_DON
                     collaborateur_id rempli dans MouvementStock
    """
    permission_classes = [MustChangePasswordPermission, IsAuthenticated, IsInfirmier]

    def post(self, request):
        medicament_id = request.data.get("medicament")
        quantite      = request.data.get("quantite")
        matricule     = str(request.data.get("matricule", "") or "").strip()
        motif_saisi   = str(request.data.get("motif",     "") or "").strip()
        site = get_site_utilisateur(request.user)

        if site is None:
            return Response(
                {"error": "Site utilisateur introuvable."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not medicament_id:
            return Response(
                {"error": "Le champ 'medicament' est obligatoire."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            quantite = int(quantite)
            if quantite <= 0:
                raise ValueError
        except (TypeError, ValueError):
            return Response(
                {"error": "La quantite doit etre un entier superieur a 0."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Résolution collaborateur si matricule fourni
        collaborateur = None
        if matricule:
            try:
                collaborateur = Collaborateur.objects.get(matricule=matricule)
            except Collaborateur.DoesNotExist:
                return Response(
                    {"error": f"Aucun collaborateur avec le matricule {matricule}."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        try:
            with transaction.atomic():
                stock = (
                    StockMedicament.objects
                    .select_for_update()
                    .filter(medicament_id=medicament_id, site=site)
                    .first()
                )
                if stock is None:
                    return Response(
                        {"error": "Aucun stock trouve pour ce medicament."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                if stock.quantite < quantite:
                    return Response(
                        {"error": f"Stock insuffisant. Disponible : {stock.quantite}."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                if stock.date_expiration and stock.date_expiration < timezone.now().date():
                    return Response(
                        {"error": "Ce medicament est perime."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                stock.quantite -= quantite
                stock.save()

                acte = None
                if collaborateur:
                    # Nominatif : crée ActeInfirmier TYPE_DON
                    acte = ActeInfirmier.objects.create(
                        type_acte=ActeInfirmier.TYPE_DON,
                        collaborateur=collaborateur,
                        medicament=stock.medicament,
                        quantite=quantite,
                        motif=motif_saisi or None,
                        infirmiere=request.user,
                    )

                # MouvementStock avec collaborateur_id rempli si nominatif
                MouvementStock.objects.create(
                    stock=stock,
                    type_mouvement=MouvementStock.SORTIE,
                    quantite=quantite,
                    utilisateur=request.user,
                    collaborateur=collaborateur,       # None si anonyme
                    motif=motif_saisi or None,
                    acte=acte,
                )

            return Response(
                {
                    "collaborateur_display": _safe_collaborateur_display(collaborateur) if collaborateur else None,
                    "success": True,
                    "medicament_id": medicament_id,
                    "quantite_sortie": quantite,
                    "stock_restant": stock.quantite,
                    "collaborateur": {
                        "id": collaborateur.id,
                        "matricule": collaborateur.matricule,
                        "nom": (collaborateur.nom or "").strip(),
                        "prenom": (collaborateur.prenom or "").strip(),
                    } if collaborateur else None,
                    "message": (
                        f"{quantite} unite(s) de {stock.medicament.nom} "
                        f"dispensee(s) a {_safe_collaborateur_display(collaborateur)}."
                        if collaborateur else
                        f"{quantite} unite(s) de {stock.medicament.nom} retiree(s) du stock."
                    ),
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"error": f"Erreur serveur : {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )