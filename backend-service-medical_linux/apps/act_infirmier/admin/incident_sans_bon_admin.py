from django.contrib import admin

from apps.act_infirmier.models import IncidentSansBon


@admin.register(IncidentSansBon)
class IncidentSansBonAdmin(admin.ModelAdmin):
    list_display = (
        "collaborateur",
        "date_incident",
        "heure_incident",
        "agent_causal",
        "segment",
        "plant_section",
        "infirmiere",
    )

    list_filter = (
        "date_incident",
        "segment",
    )

    search_fields = (
        "collaborateur__matricule",
        "agent_causal",
        "mode_lesion",
    )

    date_hierarchy = "date_incident"

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
                    "infirmiere",
                    "date_creation",
                )
            },
        ),
        (
            "Incident",
            {
                "fields": (
                    "date_incident",
                    "heure_incident",
                    "mode_lesion",
                    "agent_causal",
                )
            },
        ),
        (
            "Soin",
            {
                "fields": ("remarque",)
            },
        ),
    )
