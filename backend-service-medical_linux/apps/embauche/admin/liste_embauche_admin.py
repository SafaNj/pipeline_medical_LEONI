from django.contrib import admin

from apps.embauche.models import ListeEmbauche


@admin.register(ListeEmbauche)
class ListeEmbaucheAdmin(admin.ModelAdmin):
    list_display = ('reference', 'date_visite', 'statut', 'medecin', 'cree_par', 'date_creation')
    list_filter = ('statut', 'date_visite', 'medecin')
    search_fields = ('reference',)
    raw_id_fields = ('medecin', 'cree_par')
    readonly_fields = ('reference', 'date_creation', 'date_modification')
