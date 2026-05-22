from django.contrib import admin
from apps.account.models.HSEE_models import HSEE
from apps.account.models.profil_models import Profile

@admin.register(HSEE)
class HSEEAdmin(admin.ModelAdmin):
    list_display = ("profile", "zone", "certification", "site")

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)

        if 'profile' in form.base_fields:
            queryset = Profile.objects.filter(role='hsse')
            used_profiles = HSEE.objects.values_list('profile_id', flat=True)
            if obj and obj.profile_id:
                used_profiles = list(set(used_profiles) - {obj.profile_id})
            form.base_fields['profile'].queryset = queryset.exclude(id__in=used_profiles)

        return form