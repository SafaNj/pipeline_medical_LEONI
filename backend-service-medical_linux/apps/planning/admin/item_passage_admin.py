from django.contrib import admin
from apps.planning.models.item_passage_models import ItemPassage


@admin.register(ItemPassage)
class ItemPassageAdmin(admin.ModelAdmin):
    list_display = ('liste', 'ordre', 'collaborateur', 'statut')
    list_filter = ('statut',)
    readonly_fields = ('ordre',)
    search_fields = ('collaborateur__matricule',)
