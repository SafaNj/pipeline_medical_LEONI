from django.contrib import admin

from apps.act_infirmier.models import DeclarationCNAM


@admin.register(DeclarationCNAM)
class DeclarationCNAMAdmin(admin.ModelAdmin):
    list_display = (
        "collaborateur",
        "matricule_cnss",
        "type_accident",
        "date_accident",
        "date_limite_declaration",
        "date_cachet_cnam",
        "nb_jours_retard",
        "infirmiere",
    )

    list_filter = (
        "date_accident",
        "type_accident",
    )

    search_fields = (
        "collaborateur__matricule",
        "matricule_cnss",
        "type_accident",
        "chauffeur",
    )

    date_hierarchy = "date_accident"

    readonly_fields = (
        "matricule_cnss",
        "nb_jours_retard",
        "infirmiere",
        "date_creation",
    )

    fieldsets = (
        (
            "Identification",
            {
                "fields": (
                    "collaborateur",
                    "matricule_cnss",
                    "type_accident",
                    "date_accident",
                    "chauffeur",
                )
            },
        ),
        (
            "Suivi declaration",
            {
                "fields": (
                    "date_collecte_chauffeur",
                    "date_cachet_cnam",
                    "date_limite_declaration",
                    "nb_jours_retard",
                    "cause_retard",
                    "commentaire",
                    "actions",
                    "correction",
                )
            },
        ),
        (
            "Traçabilité",
            {
                "fields": (
                    "infirmiere",
                    "date_creation",
                )
            },
        ),
    )
