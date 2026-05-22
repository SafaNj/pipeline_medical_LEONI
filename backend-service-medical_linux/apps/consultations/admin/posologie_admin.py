from django.contrib import admin

from apps.consultations.models import PosologieStandard


@admin.register(PosologieStandard)
class PosologieStandardAdmin(admin.ModelAdmin):
    list_display = ('texte', 'ordre', 'actif', 'created_at')
    list_filter = ('actif',)
    search_fields = ('texte',)
    ordering = ('ordre', 'texte')
