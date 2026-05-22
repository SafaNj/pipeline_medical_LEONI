from django.contrib import admin
from django.utils.html import format_html

from apps.stock.models import StockMedicament


@admin.register(StockMedicament)
class StockMedicamentAdmin(admin.ModelAdmin):
    list_display = (
        'medicament',
        'quantite',
        'seuil_alerte',
        'date_expiration',
        'statut',
    )
    list_filter = ('medicament',)
    search_fields = ('medicament__nom',)
    readonly_fields = ('updated_at',)

    @admin.display(description='Statut')
    def statut(self, obj):
        if obj.quantite == 0:
            label = 'EPUISE'
            color = '#b42318'
        elif obj.quantite <= obj.seuil_alerte:
            label = 'FAIBLE'
            color = '#b54708'
        else:
            label = 'OK'
            color = '#027a48'

        return format_html('<strong style="color: {};">{}</strong>', color, label)
