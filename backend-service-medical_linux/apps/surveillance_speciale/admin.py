from django.contrib import admin

from apps.surveillance_speciale.models import LigneSurveillanceSpeciale, ListeSurveillanceSpeciale


class LigneSurveillanceSpecialeInline(admin.TabularInline):
    model = LigneSurveillanceSpeciale
    extra = 0
    raw_id_fields = ("collaborateur",)


@admin.register(ListeSurveillanceSpeciale)
class ListeSurveillanceSpecialeAdmin(admin.ModelAdmin):
    list_display = ("reference", "date_visite", "statut", "site", "medecin", "date_creation")
    list_filter = ("statut", "site")
    search_fields = ("reference", "titre")
    raw_id_fields = ("cree_par", "medecin", "site")
    inlines = [LigneSurveillanceSpecialeInline]


@admin.register(LigneSurveillanceSpeciale)
class LigneSurveillanceSpecialeAdmin(admin.ModelAdmin):
    list_display = ("id", "liste", "collaborateur", "ordre", "presence", "traitement_termine")
    list_filter = ("presence", "traitement_termine")
    raw_id_fields = ("liste", "collaborateur")
