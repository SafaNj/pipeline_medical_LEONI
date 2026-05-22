from django.contrib import admin

from apps.act_infirmier.models import MaladieChronique


@admin.register(MaladieChronique)
class MaladieChroniquAdmin(admin.ModelAdmin):
    list_display = (
        "collaborateur",
        "type_maladie",
        "date_declaration",
        "segment",
        "infirmiere",
    )

    list_filter = (
        "type_maladie",
        "segment",
    )

    search_fields = (
        "collaborateur__matricule",
        "collaborateur__nom",
    )

    date_hierarchy = "date_declaration"

    readonly_fields = (
        "infirmiere",
        "date_creation",
        "segment",
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
            "Maladie chronique",
            {
                "fields": (
                    "date_declaration",
                    "type_maladie",
                    "type_maladie_autre",
                    "num_tel",
                    "commentaire",
                )
            },
        ),
    )
