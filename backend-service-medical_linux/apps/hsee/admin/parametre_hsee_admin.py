from django.contrib import admin

from apps.hsee.models import ParametreHSEEMensuel


@admin.register(ParametreHSEEMensuel)
class ParametreHSEEMensuelAdmin(admin.ModelAdmin):
    list_display = ("annee", "mois", "heures_travaillees", "effectif_travailleurs")
    list_filter = ("annee",)
    ordering = ("-annee", "-mois")
