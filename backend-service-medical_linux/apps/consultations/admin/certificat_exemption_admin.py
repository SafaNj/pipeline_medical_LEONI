from django.contrib import admin

from apps.consultations.models import CertificatExemption


@admin.register(CertificatExemption)
class CertificatExemptionAdmin(admin.ModelAdmin):
    list_display = (
        "nom_patient",
        "duree_exemption",
        "consultation",
        "date_emission",
    )
    list_filter = ("date_emission",)
    search_fields = ("nom_patient", "nom_prenom_medecin")
    ordering = ("-date_emission",)
    readonly_fields = ("date_emission", "nom_prenom_medecin", "nom_patient")
