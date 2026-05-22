from django.contrib import admin

from apps.hsee.models import EquipementMedicalEndommage


@admin.register(EquipementMedicalEndommage)
class EquipementMedicalEndommageAdmin(admin.ModelAdmin):
    list_display = ("date_constat", "description", "date_creation")
    ordering = ("-date_constat",)
