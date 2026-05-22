from rest_framework.permissions import BasePermission

from apps.account.models import Profile
from apps.medical_work.permissions import IsMedecinTravail


class IsRH(BasePermission):
    """Allow access only to users having profile role RH."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        return Profile.objects.filter(user=user, role='rh').exists()


class IsInfirmierRole(BasePermission):
    """Allow access only to users having profile role infirmier."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        return Profile.objects.filter(user=user, role='infirmier').exists()


class IsRHOrInfirmier(BasePermission):
    """Allow access to RH and infirmier users."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        return Profile.objects.filter(user=user, role__in=['rh', 'infirmier']).exists()


class IsRHOrInfirmierOrMedecinTravail(BasePermission):
    """Allow access to RH, infirmier, and medecin du travail users."""

    def has_permission(self, request, view):
        if IsRHOrInfirmier().has_permission(request, view):
            return True

        return IsMedecinTravail().has_permission(request, view)


class IsRHOrInfirmierOrMedecinTravailOrHSSE(BasePermission):
    """Comme IsRHOrInfirmierOrMedecinTravail, plus les profils HSSE/HSEE (export HSEE, listes médecins)."""

    def has_permission(self, request, view):
        if IsRHOrInfirmierOrMedecinTravail().has_permission(request, view):
            return True
        from apps.account.permissions import IsHSSE

        return IsHSSE().has_permission(request, view)
