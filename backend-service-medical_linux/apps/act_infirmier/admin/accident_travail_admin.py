from django.contrib import admin

from apps.act_infirmier.models import AccidentTravail


@admin.register(AccidentTravail)
class AccidentTravailAdmin(admin.ModelAdmin):
    list_display = (
        "collaborateur",
        "num_cnam",
        "date_accident",
        "categorie_accident",
        "type_accident",
        "lieu_accident",
        "total_jours_perdus",
        "infirmiere",
    )

    list_filter = (
        "date_accident",
        "reporting_interne",
        "reporting_wsd",
    )

    search_fields = (
        "collaborateur__matricule",
        "collaborateur__matricule",
        "lieu_accident",
        "cause_accident",
    )

    date_hierarchy = "date_accident"

    readonly_fields = (
        "infirmiere",
        "date_creation",
        "total_jours_perdus",
    )

    fieldsets = (
        (
            "Identification",
            {
                "fields": (
                    "collaborateur",
                    "num_cnam",
                    "plant_section",
                    "infirmiere",
                    "date_creation",
                )
            },
        ),
        (
            "L'accident",
            {
                "fields": (
                    "date_accident",
                    "heure_accident",
                    "categorie_accident",
                    "type_accident",
                    "lieu_accident",
                    "description",
                )
            },
        ),
        (
            "Lesion & Cause",
            {
                "fields": (
                    "siege_lesion",
                    "nature_lesion",
                    "cause_accident",
                    "agent_materiel",
                    "temoins",
                )
            },
        ),
        (
            "Suivi medical",
            {
                "fields": (
                    "repos_initial",
                    "prolongation",
                    "total_jours_perdus",
                    "criticite",
                    "reprise_medecin_travail",
                )
            },
        ),
        (
            "Declaration",
            {
                "fields": (
                    "date_declaration_service_medical",
                    "date_sortie_declaration",
                    "chauffeur_sortie",
                    "reporting_interne",
                    "reporting_wsd",
                )
            },
        ),
    )

    @admin.display(description="Total jours perdus")
    def total_jours_perdus(self, obj):
        return obj.total_jour_perdu
