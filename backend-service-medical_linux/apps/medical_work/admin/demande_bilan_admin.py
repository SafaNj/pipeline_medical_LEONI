from datetime import date

from django.contrib import admin
from apps.medical_work.models import DemandeBilan


@admin.register(DemandeBilan)
class DemandeBilanAdmin(admin.ModelAdmin):
    
    list_display = [
        'date_demande',
        'fiche_aptitude',
    ]
    
    search_fields = [
        'fiche_aptitude__collaborateur__matricule',
        'numero_labo',
    ]
    
    list_filter = [
        'date_demande'
    ]

    readonly_fields = [
        'collaborateur_nom_prenom',
        'collaborateur_matricule',
        'collaborateur_cin',
        'collaborateur_age',
        'collaborateur_telephone',
        'collaborateur_entreprise',
        'collaborateur_poste',
    ]

    ordering = ['-date_demande']
    
    fieldsets = (
        ('🧪 Demande', {
            'fields': (
                'fiche_aptitude',
                'collaborateur_nom_prenom',
                'collaborateur_matricule',
                'collaborateur_cin',
                'collaborateur_age',
                'collaborateur_telephone',
                'collaborateur_entreprise',
                'collaborateur_poste',
                'numero_labo',
                'date_demande',
            )
        }),
        ('📋 Détails', {
            'fields': (
                'glycemie',
                'creatinine',
                'nfs',
                'vs',
                'transaminases',
                'acide_urique',
                'triglycerides',
                'cholesterol',
                'copro_parasitologique',
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

    @admin.display(description="Poste")
    def collaborateur_poste(self, obj):
        if not obj or not obj.fiche_aptitude_id or not obj.fiche_aptitude.collaborateur_id:
            return "-"
        try:
            return obj.fiche_aptitude.collaborateur.poste or "-"
        except Exception:
            return "-"