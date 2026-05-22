from apps.account.models import Medecin, Profile
from rest_framework.permissions import BasePermission


class IsMedecinTraitant(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        profile = Profile.objects.filter(user=user).first()
        if not profile or profile.role != 'medecin':
            return False

        medecin = Medecin.objects.select_related('med_type').filter(profile=profile).first()
        if not medecin or not medecin.med_type:
            return False

        med_type_name = (medecin.med_type.name or '').strip().lower()
        if not med_type_name:
            return False
        if 'non' in med_type_name and 'traitant' in med_type_name:
            return False

        accepted_names = {
            'medecin traitant',
            'médecin traitant',
            'traitant',
        }
        return med_type_name in accepted_names


class IsInfirmierOrMedecin(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if Profile.objects.filter(user=user, role='infirmier').exists():
            return True

        return IsMedecinTraitant().has_permission(request, view)


class IsAnyMedecin(BasePermission):
    """
    Accès en lecture à tous les médecins (traitant, travail, contrôleur).
    Utilisé pour les actions de consultation croisée (historique patient, etc.).
    """
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        profile = Profile.objects.filter(user=user).first()
        if not profile:
            return False

        # Infirmier aussi autorisé en lecture
        if profile.role == 'infirmier':
            return True

        # N'importe quel médecin (traitant, travail, contrôleur)
        if profile.role == 'medecin':
            return Medecin.objects.filter(profile=profile).exists()

        return False