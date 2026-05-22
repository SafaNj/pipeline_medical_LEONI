from django.contrib import admin

from apps.stock.models import Medicament


@admin.register(Medicament)
class MedicamentAdmin(admin.ModelAdmin):
    list_display = ('nom', 'dosage', 'unite', 'created_at')
    list_filter = ('unite',)
    search_fields = ('nom', 'dosage')
    ordering = ('nom',)
