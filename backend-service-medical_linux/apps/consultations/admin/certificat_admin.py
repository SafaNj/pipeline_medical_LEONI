from django.contrib import admin
from apps.consultations.models import CertificatMedical


@admin.register(CertificatMedical)
class CertificatAdmin(admin.ModelAdmin):
    list_display = (
        'consultation',
        'nom_prenom_collab',
        'jours_repos',
        'date_debut_repos',
        'date_emission',
    )
    search_fields = ('nom_prenom_collab', 'nom_prenom_medecin')
    ordering = ('-date_emission',)
    readonly_fields = (
        'date_emission',
        'nom_prenom_medecin',
        'nom_prenom_collab',
    )