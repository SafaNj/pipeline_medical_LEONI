from django.contrib import admin
from apps.account.models.medecin_models import Medecin
from apps.account.models.profil_models import Profile

@admin.register(Medecin)
class MedecinAdmin(admin.ModelAdmin):
    list_select_related = ("profile", "med_type", "site")
    list_display = (
        "profile",
        "nom_ar",
        "prenom_ar",
        "med_type",
        "site",
        "specialite",
        "numero_ordre",
        "lieu_exercice_medecin",
        "ville_cabinet",
        "gouvernorat_cabinet",
        "grade",
    )
    fieldsets = (
        (
            "Informations medecin",
            {
                "fields": (
                    "profile",
                    "med_type",
                    "site",
                    "nom_ar",
                    "prenom_ar",
                    "specialite",
                    "numero_ordre",
                    "lieu_exercice_medecin",
                    "grade",
                    "heures_par_defaut",
                )
            },
        ),
        (
            "Adresse du cabinet",
            {
                "fields": (
                    "adresse_numero_rue",
                    "ville_cabinet",
                    "gouvernorat_cabinet",
                )
            },
        ),
    )

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if 'profile' in form.base_fields:
            # tous les profils de rôle medecin
            queryset = Profile.objects.filter(role='medecin')
            # ids des profils déjà utilisés
            used_profiles = Medecin.objects.values_list('profile_id', flat=True)
            # si modification, inclure le profile actuel
            if obj and obj.profile_id:
                used_profiles = list(set(used_profiles) - {obj.profile_id})
            # exclure uniquement les autres profils utilisés
            form.base_fields['profile'].queryset = queryset.exclude(id__in=used_profiles)
        return form