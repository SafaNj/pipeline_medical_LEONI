from django.contrib import admin
from django.utils.html import format_html
from apps.control_visits.models import ContreVisite
from apps.account.models import Medecin


@admin.register(ContreVisite)
class ContreVisiteAdmin(admin.ModelAdmin):
    list_display = (
        'numero_ordre',
        'matricule',
        'nom_prenom',
        'duree_repos',
        'a_partir',
        'date',
        'afficher_lien_item'
    )
    
    list_filter = (
        'date',
        'medecin_controleur'
    )
    
    search_fields = (
        'matricule',
        'nom_prenom'
    )
    
    fieldsets = (
        ('🔗 Lien avec planning (optionnel)', {
            'fields': ('item_passage',),
            'description': 'Si vous sélectionnez un item, certains champs seront pré-remplis automatiquement'
        }),
        ('📋 Informations Excel', {
            'fields': (
                'matricule',
                'nom_prenom',
                'duree_repos',
                'a_partir',
                'date',
                'remarque'
            )
        }),
        ('👨‍⚕️ Médecin', {
            'fields': ('medecin_controleur',)
        })
    )
    
    @admin.display(description='Lié à item')
    def afficher_lien_item(self, obj):
        if obj.item_passage:
            return format_html(
                '<span style="color:#10b981; font-weight:700;">✅ Item #{}</span>',
                obj.item_passage.ordre
            )
        return format_html(
            '<span style="color:#6b7280;">➖ Saisie manuelle</span>'
        )
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'medecin_controleur':
            kwargs['queryset'] = Medecin.objects.filter(
                med_type__name__icontains='control'
            )
        elif db_field.name == 'item_passage':
            # Seulement les items de type CONTRE_VISITE et EN_ATTENTE
            kwargs['queryset'] = db_field.related_model.objects.filter(
                liste__type_liste='CONTRE_VISITE',
                statut='EN_ATTENTE',
                contre_visite__isnull=True  # Pas déjà lié à une contre-visite
            )
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
    def get_changeform_initial_data(self, request):
        """
        Pré-remplir le médecin avec l'utilisateur connecté
        """
        initial = super().get_changeform_initial_data(request)
        try:
            medecin = request.user.profile.medecin
            initial['medecin_controleur'] = medecin
        except:
            pass
        return initial
