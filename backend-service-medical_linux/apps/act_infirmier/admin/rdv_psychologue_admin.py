from django.contrib import admin

from apps.act_infirmier.models import RendezVousPsychologue


@admin.register(RendezVousPsychologue)
class RendezVousPsychologueAdmin(admin.ModelAdmin):
    list_display = (
        "collaborateur",
        "date_rdv",
        "segment",
        "secteur_collaborateur",
        "site",
        "infirmiere",
    )

    list_filter = (
        "segment",
        "secteur_collaborateur",
        "site",
    )

    search_fields = (
        "collaborateur__matricule",
        "collaborateur__nom",
    )

    date_hierarchy = "date_rdv"

    readonly_fields = (
        "infirmiere",
        "date_creation",
        "segment",
        "num_tel",
        "service",
        "position",
        "secteur_collaborateur",
        "site",
        "superieur_hierarchique",
    )

    fieldsets = (
        (
            "Identification",
            {
                "fields": (
                    "collaborateur",
                    "segment",
                    "infirmiere",
                    "date_creation",
                )
            },
        ),
        (
            "Rendez-vous",
            {
                "fields": (
                    "date_rdv",
                    "secteur_collaborateur",
                    "site",
                    "service",
                    "position",
                    "superieur_hierarchique",
                    "num_tel",
                )
            },
        ),
    )
