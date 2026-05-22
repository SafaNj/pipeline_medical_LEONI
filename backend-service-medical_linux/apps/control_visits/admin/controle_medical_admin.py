from django.contrib import admin
from django.utils.html import format_html
from apps.control_visits.models import ControleMedical


@admin.register(ControleMedical)
class ControleMedicalAdmin(admin.ModelAdmin):
    list_display = (
        'matricule',
        'nom',
        'prenom',
        'repos_prescrit',
        'segment'
    )
    
    list_filter = (
        'envoye_rh',
        'date_emission'
    )
    
    search_fields = (
        'numero_controle',
        'matricule',
        'nom',
        'prenom'
    )
    
    readonly_fields = (
        'numero_controle',
        'date_creation',
        'date_modification'
    )
    
    fieldsets = (
        ('🔗 Contre-visite', {
            'fields': ('contre_visite',)
        }),
        ('� Informations du collaborateur', {
            'fields': (
                'matricule',
                ('nom', 'prenom'),
            )
        }),
        ('📋 Avis médical', {
            'fields': (
                'repos_prescrit',
                'segment',
                'avis_medecin_controleur'
            )
        })
    )
    
  
    
    
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'contre_visite':
            # Seulement les contre-visites sans contrôle médical
            kwargs['queryset'] = db_field.related_model.objects.filter(
                controle_medical__isnull=True
            )
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
