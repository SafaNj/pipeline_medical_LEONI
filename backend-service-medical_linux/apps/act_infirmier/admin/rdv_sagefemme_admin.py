from django.contrib import admin

from apps.act_infirmier.models import RendezVousSagefemme


@admin.register(RendezVousSagefemme)
class RendezVousSagefemmeAdmin(admin.ModelAdmin):
    list_display = (
        "collaborateur",
        "date_rdv",
        "segment",
        "secteur_collaborateur",
        "site",
        "motif_rdv",
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
        "secteur_collaborateur",
        "site",
        "num_tel",
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
                    "num_tel",
                    "motif_rdv",
                    "commentaire",
                )
            },
        ),
    )
