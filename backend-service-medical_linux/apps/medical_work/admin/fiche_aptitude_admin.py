from django.contrib import admin
from apps.medical_work.models import (
    CertificatAptitude,
    DemandeBilan,
    DemandeExamen,
    FicheAptitude,
)
from apps.account.models import Medecin


class DemandeBilanInline(admin.TabularInline):
    model = DemandeBilan
    extra = 0


class DemandeExamenInline(admin.TabularInline):
    model = DemandeExamen
    extra = 0


class CertificatAptitudeInline(admin.StackedInline):
    model = CertificatAptitude
    extra = 0


@admin.register(FicheAptitude)
class FicheAptitudeAdmin(admin.ModelAdmin):
    list_display = [
        'collaborateur',
        'medecin_travail',
        'date_visite',
        'type_visite',
        'aptitude',
    ]

    list_filter = [
        'type_visite',
        'aptitude',
    ]

    search_fields = [
        'collaborateur__matricule',
        'collaborateur__numero_cnss',
    ]
    
    ordering = ['-date_visite']

    readonly_fields = [
        'collaborateur_nom_prenom',
        'collaborateur_matricule',
        'collaborateur_cin',
        'collaborateur_numero_cnss',   
        'collaborateur_date_naissance',
        'collaborateur_lieu_naissance',
        'collaborateur_adresse',
        'collaborateur_poste',
        'collaborateur_date_embauche',
        'date_creation',
    ]

    inlines = [
        DemandeBilanInline,
        DemandeExamenInline,
        CertificatAptitudeInline,
    ]
    
    fieldsets = (
        ('🏥 Visite', {
            'fields': (
                'collaborateur',
                'collaborateur_nom_prenom',
                'collaborateur_matricule',
                'collaborateur_cin',
                'collaborateur_numero_cnss',
                'collaborateur_date_naissance',
                'collaborateur_lieu_naissance',
                'collaborateur_adresse',
                'collaborateur_poste',
                'medecin_travail',
                'date_visite',
                'type_visite',
                'raison_sociale',
                'nature_activite',
                'adresse_entreprise',
                'numero_cnss_entreprise',
                'qualifications',
                'collaborateur_date_embauche',
            )
        }),
        ('✅ Aptitude', {
            'fields': (
                'aptitude',
                'precision_aptitude',
            )
        }),
    )
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "medecin_travail":
            kwargs["queryset"] = Medecin.objects.filter(
                med_type__name="travail"
            )
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    @admin.display(description="Nom & Prénom")
    def collaborateur_nom_prenom(self, obj):
        if not obj or not obj.collaborateur_id:
            return "-"
        try:
            full_name = f"{obj.collaborateur.nom} {obj.collaborateur.prenom}".strip()
            return full_name or (obj.collaborateur.matricule or "-")
        except Exception:
            return obj.collaborateur.matricule or "-"

    @admin.display(description="Matricule")
    def collaborateur_matricule(self, obj):
        if not obj or not obj.collaborateur_id:
            return "-"
        return obj.collaborateur.matricule or "-"

    @admin.display(description="CIN")
    def collaborateur_cin(self, obj):
        if not obj or not obj.collaborateur_id:
            return "-"
        try:
            return obj.collaborateur.cin or "-"
        except Exception:
            return "-"

    @admin.display(description="Date naissance")
    def collaborateur_date_naissance(self, obj):
        if not obj or not obj.collaborateur_id:
            return "-"
        try:
            return obj.collaborateur.date_naissance or "-"
        except Exception:
            return "-"

    @admin.display(description="Lieu naissance")
    def collaborateur_lieu_naissance(self, obj):
        if not obj or not obj.collaborateur_id:
            return "-"
        try:
            return obj.collaborateur.lieu_naissance or "-"
        except Exception:
            return "-"

    @admin.display(description="Adresse")
    def collaborateur_adresse(self, obj):
        if not obj or not obj.collaborateur_id:
            return "-"
        try:
            return obj.collaborateur.adresse or "-"
        except Exception:
            return "-"

    @admin.display(description="Poste")
    def collaborateur_poste(self, obj):
        if not obj or not obj.collaborateur_id:
            return "-"
        try:
            return obj.collaborateur.poste or "-"
        except Exception:
            return "-"

    @admin.display(description="Date de recrutement")
    def collaborateur_date_embauche(self, obj):
        if not obj or not obj.collaborateur_id:
            return "-"
        try:
            return obj.collaborateur.date_embauche or "-"
        except Exception:
            return "-"
    @admin.display(description="Numéro CNSS")
    def collaborateur_numero_cnss(self, obj):
        if not obj or not obj.collaborateur_id:
            return "-"
        try:
            return obj.collaborateur.numero_cnss or "-"
        except Exception:
            return "-"