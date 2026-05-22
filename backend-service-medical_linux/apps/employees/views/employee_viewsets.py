# employees/views/employee_viewsets.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions
from apps.employees.serializers import CollaborateurSerializer
from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import (
    get_im_site_filter_from_request,
    get_site_utilisateur,
    im_site_required_but_missing,
)
from apps.embauche.im_sync import get_data_from_im
from apps.employees.im_site_codes import normalize_im_site_code
from apps.employees.models import Collaborateur, ResourceIM


class CollaborateurViewSet(viewsets.ModelViewSet):
    """CRUD API for Collaborateurs (Employees)"""

    queryset = Collaborateur.objects.all()
    serializer_class = CollaborateurSerializer
    permission_classes = [
        MustChangePasswordPermission,
        IsAuthenticated,
        DjangoModelPermissions,
    ]
    # Important: search_fields doit rester limité aux colonnes SQL réelles.
    # Les propriétés dynamiques (nom, prenom, poste, department, etc.) ne sont pas requêtables via ORM.
    search_fields = ["matricule", "numero_cnss"]
    ordering_fields = ["matricule", "date_embauche"]
    filterset_fields = ["sexe"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if getattr(user, "is_superuser", False):
            return qs
        site = get_site_utilisateur(user)
        code = normalize_im_site_code((site.code or "") if site else "")
        if not code:
            return qs.none()
        mats = ResourceIM.objects.using("im_db").filter(site=code).values_list(
            "matricule", flat=True
        )
        mat_str = {str(m) for m in mats}
        return qs.filter(matricule__in=mat_str)

    @action(detail=False, methods=["get"])
    def recherche_im(self, request):
        """
        Pré-remplissage de la saisie manuelle depuis im_db via matricule.
        """
        matricule = request.query_params.get("matricule")
        if not matricule:
            return Response(
                {"error": "Le paramètre matricule est requis"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if im_site_required_but_missing(request):
            return Response(
                {"error": "Votre compte n'est associé à aucun site"},
                status=status.HTTP_403_FORBIDDEN,
            )

        data = get_data_from_im(
            matricule,
            user_site=get_im_site_filter_from_request(request),
        )
        if data is None:
            return Response(
                {
                    "error": (
                        "Ce collaborateur n'appartient pas à votre site ou est introuvable"
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response({"data": data})
