from django.contrib import admin

from apps.consultations.models import CertificatPrenuptial


@admin.register(CertificatPrenuptial)
class CertificatPrenuptialAdmin(admin.ModelAdmin):
    list_display = (
        "nom_prenom",
        "cin",
        "consultation",
        "date_emission",
    )
    list_filter = ("date_emission",)
    search_fields = (
        "nom_prenom",
        "cin",
        "nom_prenom_medecin",
        "numero_ordre_medecin",
        "specialite_medecin",
        "lieu_exercice_medecin",
        "adresse_medecin",
        "ville_medecin",
        "gouvernorat_medecin",
    )
    ordering = ("-date_emission",)
    readonly_fields = (
        "date_emission",
        "nom_prenom_medecin",
        "nom_prenom",
        "date_naissance",
        "lieu_naissance",
        "cin",
        "adresse_patient",
    )
