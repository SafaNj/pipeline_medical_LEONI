from apps.account.models import Profile
from rest_framework.permissions import BasePermission


class IsInfirmier(BasePermission):
    """Allow access only to authenticated users with profile.role == 'infirmier'."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        try:
            return Profile.objects.filter(
                user=user,
                role__in=['infirmier', 'infirmiere'],
            ).exists()
        except Profile.DoesNotExist:
            return False


class IsInfirmierOrAnyMedecin(BasePermission):
    """Infirmier ou tout médecin (traitant, travail, contrôleur) — lecture documents archivés."""

    def has_permission(self, request, view):
        if IsInfirmier().has_permission(request, view):
            return True
        from apps.consultations.permissions import IsAnyMedecin

        return IsAnyMedecin().has_permission(request, view)
