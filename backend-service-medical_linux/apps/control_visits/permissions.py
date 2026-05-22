from rest_framework.permissions import BasePermission

from apps.account.models import Medecin, Profile


class IsMedecinControleur(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        try:
            profile = Profile.objects.get(user=user)
        except Profile.DoesNotExist:
            return False

        if profile.role != 'medecin':
            return False

        try:
            medecin = Medecin.objects.select_related('med_type').get(profile=profile)
        except Medecin.DoesNotExist:
            return False

        med_type_name = ''
        if medecin.med_type and medecin.med_type.name:
            med_type_name = medecin.med_type.name

        name_lower = med_type_name.lower()
        return 'controleur' in name_lower or 'contrôleur' in name_lower
