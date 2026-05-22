from django.contrib import admin

from apps.act_infirmier.models import IncidentAvecBon


@admin.register(IncidentAvecBon)
class IncidentAvecBonAdmin(admin.ModelAdmin):
    list_display = (
        "collaborateur",
        "date_bon",
        "date_incident",
        "destination",
        "cause",
        "num_assurance",
        "segment",
        "infirmiere",
    )

    list_filter = (
        "date_bon",
        "date_incident",
        "segment",
    )

    search_fields = (
        "collaborateur__matricule",
        "destination",
        "cause",
        "num_assurance",
    )

    date_hierarchy = "date_bon"

    readonly_fields = (
        "infirmiere",
        "date_creation",
        "segment",
        "plant_section",
    )

    fieldsets = (
        (
            "Identification",
            {
                "fields": (
                    "collaborateur",
                    "segment",
                    "plant_section",
                    "num_assurance",
                    "infirmiere",
                    "date_creation",
                )
            },
        ),
        (
            "Bon de sortie",
            {
                "fields": (
                    "date_bon",
                    "date_incident",
                    "destination",
                    "incident_origine",
                )
            },
        ),
        (
            "Incident",
            {
                "fields": (
                    "cause",
                    "lesion",
                )
            },
        ),
    )
