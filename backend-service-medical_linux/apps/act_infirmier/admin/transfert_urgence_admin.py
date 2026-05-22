from django.contrib import admin

from apps.act_infirmier.models import TransfertUrgence


@admin.register(TransfertUrgence)
class TransfertUrgenceAdmin(admin.ModelAdmin):
    list_display = (
        "collaborateur",
        "date",
        "heure",
        "chauffeur",
        "telephone_chauffeur",
        "sms_chauffeur_envoye",
        "depart",
        "destination",
        "num_ordre",
        "plant",
        "frais_deplacement",
        "infirmiere",
    )

    list_filter = (
        "date",
        "plant",
        "destination",
    )

    search_fields = (
        "collaborateur__matricule",
        "chauffeur",
        "destination",
        "cost_center",
    )

    date_hierarchy = "date"

    readonly_fields = (
        "infirmiere",
        "date_creation",
        "sms_chauffeur_envoye",
    )

    fieldsets = (
        (
            "Transport",
            {
                "fields": (
                    "date",
                    "heure",
                    "chauffeur",
                    "telephone_chauffeur",
                    "sms_chauffeur_envoye",
                    "depart",
                    "destination",
                    "num_ordre",
                    "plant",
                    "frais_deplacement",
                    "cost_center",
                )
            },
        ),
        (
            "Collaborateur",
            {
                "fields": (
                    "collaborateur",
                    "infirmiere",
                    "date_creation",
                )
            },
        ),
    )
