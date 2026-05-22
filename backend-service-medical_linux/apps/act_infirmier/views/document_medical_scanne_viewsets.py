from django.db.models import Q, QuerySet
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import filter_queryset_by_user_site
from apps.act_infirmier.document_scan_query import queryset_documents_pour_utilisateur
from apps.act_infirmier.models import DocumentMedicalScanne
from apps.act_infirmier.permissions import IsInfirmier, IsInfirmierOrAnyMedecin
from apps.act_infirmier.serializers.document_medical_scanne_serializers import (
    DocumentMedicalScanneSerializer,
)


class DocumentMedicalScanneViewSet(viewsets.ModelViewSet):
    """
    Archives (PDF / image) déposées par l'infirmerie.

    - Création / modification / suppression : infirmier uniquement.
    - Lecture : infirmier (tout) ; médecin traitant (fiche + dossier) ;
      médecin travail ou contrôleur (dossier médical uniquement).

    Filtres optionnels : ?collaborateur=<id> et/ou ?matricule_ref=<matricule>
    """

    serializer_class = DocumentMedicalScanneSerializer

    def get_permissions(self):
        base = [MustChangePasswordPermission, IsAuthenticated]
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [p() for p in (*base, IsInfirmier)]
        return [p() for p in (*base, IsInfirmierOrAnyMedecin)]

    def get_queryset(self) -> QuerySet:
        qs = DocumentMedicalScanne.objects.select_related("collaborateur", "depose_par").all()

        collab = self.request.query_params.get("collaborateur")
        mat = (self.request.query_params.get("matricule_ref") or "").strip()
        if collab:
            qs = qs.filter(collaborateur_id=collab)
        elif mat:
            qs = qs.filter(
                Q(matricule_ref__iexact=mat)
                | Q(collaborateur__matricule__iexact=mat)
            )

        qs = filter_queryset_by_user_site(qs, self.request.user)
        return queryset_documents_pour_utilisateur(qs, self.request.user)
