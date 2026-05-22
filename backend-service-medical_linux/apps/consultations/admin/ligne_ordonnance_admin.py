from django.contrib import admin
from django.utils.html import format_html

from apps.consultations.models import LigneOrdonnance


@admin.register(LigneOrdonnance)
class LigneOrdonnanceAdmin(admin.ModelAdmin):
    list_display = (
        'ordonnance',
        'texte',
        'medicament',
        'statut_display',
        'ordre',
        'created_at',
    )
    list_filter = ('statut', 'medicament')
    search_fields = ('texte', 'medicament__nom')
    readonly_fields = ('ordre', 'created_at')
    ordering = ('ordonnance', 'ordre')

    @admin.display(description='Statut')
    def statut_display(self, obj):
        if obj.statut == LigneOrdonnance.STATUT_DONNEE:
            color = '#027a48'
        elif obj.statut == LigneOrdonnance.STATUT_PHARMACIE:
            color = '#b54708'
        else:
            color = '#175cd3'

        return format_html('<strong style="color: {};">{}</strong>', color, obj.get_statut_display())
