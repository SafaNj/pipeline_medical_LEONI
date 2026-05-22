from django.contrib import admin
from apps.account.models.infirmier_models import Infirmier
from apps.account.models.profil_models import Profile

@admin.register(Infirmier)
class InfirmierAdmin(admin.ModelAdmin):
    list_display = ("profile", "service", "shift", "site")

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)

        if 'profile' in form.base_fields:
            queryset = Profile.objects.filter(role='infirmier')
            used_profiles = Infirmier.objects.values_list('profile_id', flat=True)
            if obj and obj.profile_id:
                used_profiles = list(set(used_profiles) - {obj.profile_id})
            form.base_fields['profile'].queryset = queryset.exclude(id__in=used_profiles)

        return form