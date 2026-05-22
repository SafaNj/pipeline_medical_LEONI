from django.contrib import admin
from apps.account.models.rh_models import RH
from apps.account.models.profil_models import Profile

@admin.register(RH)
class RHAdmin(admin.ModelAdmin):
    list_display = ("profile", "departement", "site")

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)

        if 'profile' in form.base_fields:
            # Tous les profils de rôle RH
            queryset = Profile.objects.filter(role='rh')

            # IDs des profils déjà utilisés par d'autres RH
            used_profiles = RH.objects.values_list('profile_id', flat=True)

            if obj and obj.profile_id:
                # Retirer le profile actuel de la liste des exclus
                used_profiles = list(set(used_profiles) - {obj.profile_id})

            # Exclure uniquement les autres profils déjà assignés
            form.base_fields['profile'].queryset = queryset.exclude(id__in=used_profiles)

        return form