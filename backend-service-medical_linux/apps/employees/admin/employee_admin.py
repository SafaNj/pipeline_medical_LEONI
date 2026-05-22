from django.contrib import admin
from apps.employees.models import Collaborateur


@admin.register(Collaborateur)
class CollaborateurAdmin(admin.ModelAdmin):
    list_display = (
        "matricule",
        "nom",
        "prenom",
        "numero_cnss",
        "department",
        "plant_section",
        "segment",
        "poste",
        "sexe",
    )

    list_filter = ("sexe",)
    search_fields = ("matricule", "numero_cnss")
    ordering = ("matricule",)
    fields = (
        "matricule",
        "numero_cnss",
        "date_naissance",
        "sexe",
        "date_embauche",
    )

    def get_readonly_fields(self, request, obj=None):
        """
        Rendre le matricule non modifiable en édition.
        """
        if obj is not None:
            return ["matricule"]
        return []