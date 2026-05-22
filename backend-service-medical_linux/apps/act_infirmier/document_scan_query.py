"""
Filtre des documents scannés selon le rôle (infirmier / médecin traitant / autre médecin).
Réutilisé par le ViewSet et par DossierMedicalDetailSerializer.
"""
from django.db.models import Q, QuerySet

from apps.account.models import Medecin
from apps.account.models.profil_models import Profile
from apps.act_infirmier.models import DocumentMedicalScanne


def _medecin_est_traitant(medecin: Medecin | None) -> bool:
    if not medecin or not medecin.med_type_id:
        return False
    name = (medecin.med_type.name or "").lower()
    return "traitant" in name


def queryset_documents_pour_utilisateur(qs: QuerySet, user) -> QuerySet:
    """Restreint le queryset selon infirmier (tout) ou type de médecin."""
    profile = Profile.objects.filter(user=user).first()
    if not profile:
        return qs.none()
    if profile.role == "infirmier":
        return qs
    if profile.role != "medecin":
        return qs.none()
    medecin = Medecin.objects.filter(profile=profile).select_related("med_type").first()
    if not medecin:
        return qs.none()
    if _medecin_est_traitant(medecin):
        return qs
    return qs.filter(type_document=DocumentMedicalScanne.TYPE_DOSSIER_MEDICAL)


def queryset_scans_pour_dossier(collaborateur_id, matricule_ref_dossier: str | None) -> QuerySet:
    """
    Documents liés à un dossier : par collaborateur et/ou matricule (candidat sans FK).
    """
    base = DocumentMedicalScanne.objects.all()
    if collaborateur_id:
        from apps.employees.models import Collaborateur

        try:
            mat = Collaborateur.objects.only("matricule").get(pk=collaborateur_id).matricule
        except Collaborateur.DoesNotExist:
            mat = None
        q = Q(collaborateur_id=collaborateur_id)
        if mat:
            q |= Q(collaborateur__isnull=True, matricule_ref=mat)
        return base.filter(q)
    if matricule_ref_dossier:
        return base.filter(
            collaborateur__isnull=True,
            matricule_ref__iexact=matricule_ref_dossier.strip(),
        )
    return base.none()
