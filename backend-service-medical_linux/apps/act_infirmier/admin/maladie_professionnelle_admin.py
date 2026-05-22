from django.contrib import admin

from apps.act_infirmier.models import MaladieProfessionnelle


@admin.register(MaladieProfessionnelle)
class MaladieProfessionnelleAdmin(admin.ModelAdmin):
    list_display = (
        "collaborateur",
        "anciennete",
        "maladie",
        "code_tableau_cnam",
        "date_debut_maladie",
        "mois",
        "repos_total",
        "infirmiere",
    )

    list_filter = (
        "date_debut_maladie",
        "changement_poste",
        "reprise_medecin_traitant",
    )

    search_fields = (
        "collaborateur__matricule",
        "collaborateur__matricule",
        "maladie",
        "cause",
        "decision_medecin",
    )

    date_hierarchy = "date_debut_maladie"

    readonly_fields = (
        "anciennete",
        "infirmiere",
        "date_creation",
        "repos_total",
    )

    fieldsets = (
        (
            "Identification",
            {
                "fields": (
                    "collaborateur",
                    "anciennete",
                    "plant_section",
                    "segment",
                    "infirmiere",
                    "date_creation",
                )
            },
        ),
        (
            "La maladie",
            {
                "fields": (
                    "mois",
                    "date_debut_maladie",
                    "maladie",
                    "code_tableau_cnam",
                    "cause",
                )
            },
        ),
        (
            "Poste & Travail",
            {
                "fields": (
                    "nature_travail",
                    "changement_poste",
                    "ancien_poste",
                    "nouveau_poste",
                )
            },
        ),
        (
            "Decision medicale",
            {
                "fields": (
                    "decision_medecin",
                    "repos_initial",
                    "prolongation",
                    "rechute",
                    "repos_total",
                    "reprise_medecin_traitant",
                    "reprise_medecin_travail",
                )
            },
        ),
        (
            "Declaration",
            {
                "fields": (
                    "date_declaration_service_medical",
                    "date_sortie_declaration",
                    "chauffeur_sortie",
                )
            },
        ),
    )
