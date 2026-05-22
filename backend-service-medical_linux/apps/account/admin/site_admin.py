from django.contrib import admin

from apps.account.models import Site


@admin.register(Site)
class SiteAdmin(admin.ModelAdmin):
    list_display = (
        "nom",
        "code",
        "telephone",
        "adresse",
        "raison_sociale",
        "nature_activite",
        "numero_cnss_entreprise",
    )
    search_fields = (
        "nom",
        "nom_ar",
        "code",
        "adresse",
        "telephone",
        "raison_sociale",
        "nature_activite",
        "numero_cnss",
        "numero_cnss_entreprise",
    )
    list_filter = ("code",)

    fieldsets = (
        (
            None,
            {
                "fields": (
                    "nom",
                    "nom_ar",
                    "code",
                    "template_key",
                    "logo",
                )
            },
        ),
        (
            "Contact",
            {
                "fields": (
                    "adresse",
                    "telephone",
                )
            },
        ),
        (
            "Entreprise",
            {
                "fields": (
                    "raison_sociale",
                    "nature_activite",
                    "numero_cnss_entreprise",
                    "adresse_entreprise",
                    "qualifications",
                )
            },
        ),
        (
            "Compatibilité",
            {
                "fields": ("numero_cnss",),
                "description": "Ancien champ CNSS site (conservé pour rétro-compatibilité).",
            },
        ),
    )
