from rest_framework.permissions import BasePermission

from apps.account.models import Medecin, Profile


def get_request_medecin(request):
    user = getattr(request, 'user', None)
    if not user or not user.is_authenticated:
        return None
    try:
        return Medecin.objects.select_related('site', 'med_type').get(profile__user=user)
    except Medecin.DoesNotExist:
        return None


def get_request_site_id(request):
    medecin = get_request_medecin(request)
    return medecin.site_id if medecin and medecin.site_id else None


def resolve_object_site_id(obj):
    if obj is None:
        return None

    site_id = getattr(obj, 'site_id', None)
    if site_id is not None:
        return site_id

    if hasattr(obj, 'medecin_travail_id') and getattr(obj, 'medecin_travail_id', None):
        try:
            return obj.medecin_travail.site_id
        except Exception:
            return None

    if hasattr(obj, 'medecin_id') and getattr(obj, 'medecin_id', None):
        try:
            return obj.medecin.site_id
        except Exception:
            return None

    if hasattr(obj, 'fiche_aptitude_id') and getattr(obj, 'fiche_aptitude_id', None):
        try:
            return obj.fiche_aptitude.site_id
        except Exception:
            return None

    if hasattr(obj, 'liste_id') and getattr(obj, 'liste_id', None):
        try:
            return obj.liste.medecin.site_id
        except Exception:
            return None

    if hasattr(obj, 'collaborateur_id') and getattr(obj, 'collaborateur_id', None):
        try:
            fiche = obj.collaborateur.fiches_aptitude.order_by('-date_visite', '-pk').first()
            return fiche.site_id if fiche else None
        except Exception:
            return None

    return None


class IsMedecinTravail(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        try:
            profile = Profile.objects.get(user=user)
        except Profile.DoesNotExist:
            return False

        if profile.role != "medecin":
            return False

        try:
            medecin = Medecin.objects.select_related("med_type").get(profile=profile)
        except Medecin.DoesNotExist:
            return False

        med_type_name = ""
        if medecin.med_type and medecin.med_type.name:
            med_type_name = medecin.med_type.name

        return "travail" in med_type_name.lower()


class IsSameSiteOrAssignedMedecin(BasePermission):
    """For medical doctors, restrict object access to the same site."""

    def has_object_permission(self, request, view, obj):
        site_id = get_request_site_id(request)
        if not site_id:
            return True
        obj_site_id = resolve_object_site_id(obj)
        if obj_site_id is None:
            return True
        if resolve_object_site_id(obj) != site_id:
            from rest_framework.exceptions import NotFound
            raise NotFound()  # ← retourne 404 au lieu de 403
        return True