# account/permissions.py
from rest_framework.permissions import BasePermission, SAFE_METHODS
from apps.account.models import Profile


class MustChangePasswordPermission(BasePermission):
    """
    Permission that blocks access if user must change their password.
    Checks if user is authenticated AND has must_change_password=True
    If both are true, access is denied with a clear message.
    """
    message = 'You must change your password before accessing the application. Use /api/account/change-password/'

    def has_permission(self, request, view):
        # Allow unauthenticated users (they'll be caught by IsAuthenticated)
        if not request.user or not request.user.is_authenticated:
            return True

        # Check if user must change password
        try:
            profile = Profile.objects.get(user=request.user)
            if profile.must_change_password:
                return False
        except Profile.DoesNotExist:
            # If profile doesn't exist, allow access
            pass

        return True


def get_user_role(user):
    """
    Helper to retrieve the user's role from Profile.
    """
    if not user or not user.is_authenticated:
        return None

    try:
        profile = Profile.objects.get(user=user)
        return profile.role
    except Profile.DoesNotExist:
        return None


class IsAdmin(BasePermission):
    """
    Allow access only to admin users (Django superuser).
    """

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, "is_superuser", False))


class IsAuthenticatedOrOptions(BasePermission):
    """
    Comme IsAuthenticated, mais autorise OPTIONS (préflight CORS) sans utilisateur,
    au cas où la requête atteindrait DRF avant d'être court-circuitée par corsheaders.
    """

    def has_permission(self, request, view):
        if request.method == "OPTIONS":
            return True
        return bool(request.user and request.user.is_authenticated)


class IsHSSE(BasePermission):
    """Profil role=hsse (insensible à la casse) ou groupe Django « HSSE »."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if Profile.objects.filter(user=user, role__iexact="hsse").exists():
            return True
        return user.groups.filter(name__iexact="HSSE").exists()


class IsAnyMedecinOrHSSE(BasePermission):
    """
    Infirmier, tout médecin (comme IsAnyMedecin), ou rôle HSSE — ex. dashboard HSEE en lecture.
    """

    def has_permission(self, request, view):
        if request.method == "OPTIONS":
            return True
        if IsHSSE().has_permission(request, view):
            return True
        from apps.consultations.permissions import IsAnyMedecin

        return IsAnyMedecin().has_permission(request, view)
