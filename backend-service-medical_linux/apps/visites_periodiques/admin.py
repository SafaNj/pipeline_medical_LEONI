from django.contrib import admin

from apps.visites_periodiques.models import LigneVisitePeriodique, ListeVisitePeriodique


class LigneVisitePeriodiqueInline(admin.TabularInline):
    model = LigneVisitePeriodique
    extra = 0
    raw_id_fields = ("collaborateur", "fiche_aptitude")


@admin.register(ListeVisitePeriodique)
class ListeVisitePeriodiqueAdmin(admin.ModelAdmin):
    list_display = ("reference", "date_visite", "statut", "medecin", "date_creation")
    list_filter = ("statut", "date_visite")
    search_fields = ("reference",)
    raw_id_fields = ("medecin", "cree_par")
    inlines = [LigneVisitePeriodiqueInline]


@admin.register(LigneVisitePeriodique)
class LigneVisitePeriodiqueAdmin(admin.ModelAdmin):
    list_display = ("id", "liste", "collaborateur", "presence", "fiche_aptitude")
    list_filter = ("presence",)
    raw_id_fields = ("liste", "collaborateur", "fiche_aptitude")
