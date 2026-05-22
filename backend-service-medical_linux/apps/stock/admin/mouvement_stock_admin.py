from django.contrib import admin

from apps.stock.models import MouvementStock


@admin.register(MouvementStock)
class MouvementStockAdmin(admin.ModelAdmin):
    list_display = (
        'stock',
        'type_mouvement',
        'quantite',
        'utilisateur',
        'date_mouvement',
        'motif',
    )
    list_filter = ('type_mouvement', 'date_mouvement')
    search_fields = ('stock__medicament__nom', 'utilisateur__username')
    date_hierarchy = 'date_mouvement'

    def get_readonly_fields(self, request, obj=None):
        # Lock all database fields: movement history must stay immutable.
        return [field.name for field in self.model._meta.fields]
