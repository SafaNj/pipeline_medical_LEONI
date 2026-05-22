from django.contrib import admin

from apps.consultations.models import CertificatBonneSante


@admin.register(CertificatBonneSante)
class CertificatBonneSanteAdmin(admin.ModelAdmin):
    list_display = (
        "nom_prenom_enfant",
        "date_naissance",
        "consultation",
        "date_emission",
    )
    list_filter = ("date_emission",)
    search_fields = ("nom_prenom_enfant", "nom_prenom_medecin")
    ordering = ("-date_emission",)
    readonly_fields = ("date_emission", "nom_prenom_medecin")
