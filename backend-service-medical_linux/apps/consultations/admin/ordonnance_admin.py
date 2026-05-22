from django.contrib import admin
from apps.consultations.models import LigneOrdonnance, Ordonnance


class LigneOrdonnanceInline(admin.TabularInline):
    model = LigneOrdonnance
    extra = 0
    readonly_fields = ('ordre', 'created_at', 'statut')
    fields = ('texte', 'medicament', 'statut', 'ordre')


@admin.register(Ordonnance)
class OrdonnanceAdmin(admin.ModelAdmin):
    inlines = [LigneOrdonnanceInline]
    list_display = ('id', 'consultation', 'date_emission', 'lignes_count')
    search_fields = ('consultation__item_passage__collaborateur__matricule',)
    list_filter = ('date_emission',)
    ordering = ('-date_emission',)
    readonly_fields = ('date_emission',)

    @admin.display(description='Nombre de lignes')
    def lignes_count(self, obj):
        return obj.lignes_ordonnance.count()