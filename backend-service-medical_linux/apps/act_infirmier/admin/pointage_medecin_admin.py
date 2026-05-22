from django.contrib import admin

from apps.act_infirmier.models import PointageMedecin


@admin.register(PointageMedecin)
class PointageMedecinAdmin(admin.ModelAdmin):
    list_display = (
        "medecin",
        "date",
        "heures_travaillees",
        "mois",
        "annee",
        "remarque",
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
            "Pointage",
            {
                "fields": (
                    "medecin",
                    "date",
                    "heures_travaillees",
                    "remarque",
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
