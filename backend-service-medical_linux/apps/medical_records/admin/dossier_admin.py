from django.contrib import admin
from apps.medical_records.models import DossierMedical
@admin.register(DossierMedical)
class DossierMedicalAdmin(admin.ModelAdmin):
    list_display = (
        "nom",
        "prenom",
        "groupe_sanguin",
        "collaborateur",
        "tabac",
        "alcool",
        "date_creation",
    )

    list_filter = ("groupe_sanguin", "tabac", "alcool")
    search_fields = ("nom", "prenom", "collaborateur__matricule")
    ordering = ("nom", "prenom")
    readonly_fields = ("date_creation", "date_modification")

    fieldsets = (
        (
            "Identification",
            {
                "fields": (
                    "collaborateur",
                    "nom",
                    "prenom",
                    "date_naissance",
                    "lieu_naissance",
                    "adresse",
                    "photo",
                )
            },
        ),
        (
            "Médical",
            {
                "fields": ("groupe_sanguin", "allergies"),
            },
        ),
        (
            "Antécédents",
            {
                "fields": (
                    "antecedents_medicaux",
                    "antecedents_chirurgicaux",
                    "antecedents_gyneco",
                    "antecedents_familiaux",
                )
            },
        ),
        (
            "Vaccinations",
            {
                "fields": (
                    "vaccin_tuberculose",
                    "vaccin_tetanos",
                    "vaccin_hepatite",
                    "autres_vaccins",
                )
            },
        ),
        (
            "Habitudes",
            {
                "fields": ("tabac", "alcool", "automedication"),
            },
        ),
        (
            "Métadonnées",
            {
                "fields": ("date_creation", "date_modification"),
            },
        ),
    )
