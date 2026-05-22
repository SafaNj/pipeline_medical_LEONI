from django.contrib import admin

from apps.act_infirmier.models import AbsenceMedecin


@admin.register(AbsenceMedecin)
class AbsenceMedecinAdmin(admin.ModelAdmin):
    list_display = (
        "medecin",
        "date",
        "motif",
        "mois",
        "annee",
        "infirmiere",
    )

    list_filter = ("mois", "annee", "medecin")

    search_fields = (
        "medecin__profile__user__first_name",
        "medecin__profile__user__last_name",
    )

    date_hierarchy = "date"

    readonly_fields = ("infirmiere", "date_creation", "mois", "annee")

    fieldsets = (
        (
            "Absence",
            {
                "fields": (
                    "medecin",
                    "date",
                    "motif",
                )
            },
        ),
        (
            "Traçabilité",
            {
                "fields": (
                    "mois",
                    "annee",
                    "infirmiere",
                    "date_creation",
                )
            },
        ),
    )
