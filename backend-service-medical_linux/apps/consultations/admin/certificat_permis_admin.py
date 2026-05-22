from django.contrib import admin

from apps.consultations.models import CertificatPermisConduire


@admin.register(CertificatPermisConduire)
class CertificatPermisConduireAdmin(admin.ModelAdmin):
    list_display = (
        "nom_prenom",
        "cin",
        "groupe_permis",
        "numero_ordre_medecin",
        "consultation",
        "date_emission",
    )
    list_filter = ("groupe_permis", "date_emission", "examine_par_specialiste", "certificat_delivre_par_specialiste", "inapte_conduite")
    search_fields = (
        "nom_prenom",
        "cin",
        "adresse_residence",
        "nom_prenom_medecin",
        "numero_ordre_medecin",
        "lieu_exercice_medecin",
        "sous_paragraphe",
        "paragraphe",
        "classe",
    )
    ordering = ("-date_emission",)
    readonly_fields = (
        "date_emission",
        "nom_prenom_medecin",
        "nom_prenom",
        "date_naissance",
        "lieu_naissance",
        "adresse_residence",
    )
