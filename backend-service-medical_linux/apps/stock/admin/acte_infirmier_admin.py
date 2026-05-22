from django.contrib import admin

from apps.stock.models import ActeInfirmier


@admin.register(ActeInfirmier)
class ActeInfirmierAdmin(admin.ModelAdmin):
    list_display = (
        'collaborateur',
        'medicament',
        'quantite',
        'infirmiere',
        'date_acte',
        'ligne_ordonnance',
    )
    list_filter = ('medicament', 'infirmiere', 'date_acte')
    search_fields = (
        'collaborateur__matricule',
        'medicament__nom',
    )
    readonly_fields = ('date_acte', 'infirmiere')
    date_hierarchy = 'date_acte'
