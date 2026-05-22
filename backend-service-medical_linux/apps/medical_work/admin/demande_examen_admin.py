from datetime import date

from django.contrib import admin
from apps.medical_work.models import DemandeExamen


@admin.register(DemandeExamen)
class DemandeExamenAdmin(admin.ModelAdmin):
    
    list_display = [
        'numero_examen',
        'date_demande',
        'fiche_aptitude',
    ]
    
    search_fields = [
        'fiche_aptitude__collaborateur__matricule',
    ]
    
    list_filter = [
        'date_demande'
    ]

    readonly_fields = [
        'numero_examen',
        'collaborateur_nom_prenom',
        'collaborateur_matricule',
        'collaborateur_cin',
        'collaborateur_telephone',
        'collaborateur_entreprise',
        'collaborateur_age',
        'collaborateur_poste',
    ]

    ordering = ['-date_demande']
    
    fieldsets = (
        ('🔬 Demande', {
            'fields': (
                'fiche_aptitude',
                'numero_examen',
                'collaborateur_nom_prenom',
                'collaborateur_matricule',
                'collaborateur_cin',
                'collaborateur_telephone',
                'collaborateur_entreprise',
                'collaborateur_age',
                'collaborateur_poste',
                'date_demande',
            )
        }),
        ('📋 Détails', {
            'fields': (
                'visiotest',
                'audiogramme',
                'ecg',
                'efr'
            )
        }),
    )

    @admin.display(description="Nom & Prénom")
    def collaborateur_nom_prenom(self, obj):
        if not obj or not obj.fiche_aptitude_id or not obj.fiche_aptitude.collaborateur_id:
            return "-"
        collab = obj.fiche_aptitude.collaborateur
        try:
            full_name = f"{collab.nom} {collab.prenom}".strip()
            return full_name or (collab.matricule or "-")
        except Exception:
            return collab.matricule or "-"

    @admin.display(description="Matricule")
    def collaborateur_matricule(self, obj):
        if not obj or not obj.fiche_aptitude_id or not obj.fiche_aptitude.collaborateur_id:
            return "-"
        return obj.fiche_aptitude.collaborateur.matricule or "-"

    @admin.display(description="CIN")
    def collaborateur_cin(self, obj):
        if not obj or not obj.fiche_aptitude_id or not obj.fiche_aptitude.collaborateur_id:
            return "-"
        try:
            return obj.fiche_aptitude.collaborateur.cin or "-"
        except Exception:
            return "-"

    @admin.display(description="GSM")
    def collaborateur_telephone(self, obj):
        if not obj or not obj.fiche_aptitude_id or not obj.fiche_aptitude.collaborateur_id:
            return "-"
        try:
            return obj.fiche_aptitude.collaborateur.telephone or "-"
        except Exception:
            return "-"

    @admin.display(description="Nom entreprise")
    def collaborateur_entreprise(self, obj):
        if not obj or not obj.fiche_aptitude_id or not obj.fiche_aptitude.collaborateur_id:
            return "-"
        try:
            return obj.fiche_aptitude.collaborateur.department or "-"
        except Exception:
            return "-"

    @admin.display(description="Âge")
    def collaborateur_age(self, obj):
        if not obj or not obj.fiche_aptitude_id or not obj.fiche_aptitude.collaborateur_id:
            return "-"
        date_naissance = obj.fiche_aptitude.collaborateur.date_naissance
        if not date_naissance:
            return "-"
        today = date.today()
        return today.year - date_naissance.year - (
            (today.month, today.day) < (date_naissance.month, date_naissance.day)
        )

    @admin.display(description="Poste")
    def collaborateur_poste(self, obj):
        if not obj or not obj.fiche_aptitude_id or not obj.fiche_aptitude.collaborateur_id:
            return "-"
        try:
            return obj.fiche_aptitude.collaborateur.poste or "-"
        except Exception:
            return "-"