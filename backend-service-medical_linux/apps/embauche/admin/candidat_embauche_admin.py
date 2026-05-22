from django.contrib import admin

from apps.embauche.models import CandidatEmbauche


@admin.register(CandidatEmbauche)
class CandidatEmbaucheAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'liste',
        'matricule',
        'nom',
        'prenom',
        'presence',
        'etat_embauche',
        'statut_integration',
        'collaborateur',
    )
    list_filter = ('presence', 'etat_embauche', 'statut_integration', 'liste')
    search_fields = ('matricule', 'nom', 'prenom', 'cin')
    raw_id_fields = ('liste', 'fiche_aptitude', 'collaborateur')
    readonly_fields = ('ligne_source', 'date_creation')
