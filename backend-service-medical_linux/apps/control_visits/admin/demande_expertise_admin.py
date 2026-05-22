from django.contrib import admin

from apps.control_visits.models import DemandeExpertise


@admin.register(DemandeExpertise)
class DemandeExpertiseAdmin(admin.ModelAdmin):
    list_display = (
        'collaborateur_nom',
        'collaborateur_prenom',
        'collaborateur_matricule',
        'dr',
        'date_demande',
        'medecin_controleur',
    )
    search_fields = (
        'collaborateur_nom',
        'collaborateur_matricule',
        'dr',
    )
    date_hierarchy = 'date_demande'
    readonly_fields = (
        'medecin_controleur',
        'date_creation',
    )
    fieldsets = (
        ('Identification', {
            'fields': (
                'contre_visite',
                'medecin_controleur',
                'date_creation',
                'date_demande',
            )
        }),
        ('Collaborateur', {
            'fields': (
                'collaborateur_nom',
                'collaborateur_prenom',
                'collaborateur_matricule',
            )
        }),
        ('Mission', {
            'fields': (
                'dr',
                'pieces_jointes',
                'poste',
                'autres_missions',
            )
        }),
    )
