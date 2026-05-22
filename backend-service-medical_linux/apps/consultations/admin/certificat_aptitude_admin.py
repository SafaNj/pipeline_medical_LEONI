from django.contrib import admin

from apps.consultations.models import CertificatAptitudeGenerale


@admin.register(CertificatAptitudeGenerale)
class CertificatAptitudeGeneraleAdmin(admin.ModelAdmin):
    list_display = (
        "nom_prenom_patient",
        "date_naissance",
        "apte_sport",
        "apte_collectivite",
        "consultation",
        "date_emission",
    )
    list_filter = ("apte_sport", "apte_collectivite", "date_emission")
    search_fields = ("nom_prenom_patient", "nom_prenom_medecin")
    ordering = ("-date_emission",)
    readonly_fields = (
        "date_emission",
        "nom_prenom_medecin",
        "nom_prenom_patient",
        "date_naissance",
    )
