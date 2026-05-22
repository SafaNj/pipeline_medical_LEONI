from django.contrib import admin
from apps.medical_work.models import CertificatAptitude
from apps.medical_work.models import CertificatAptitudeMateur


class CertificatAptitudeMateurInline(admin.StackedInline):
    model = CertificatAptitudeMateur
    extra = 0
    max_num = 1
    can_delete = True
    fieldsets = (
        ('🧩 Mateur (champs)', {
            'fields': (
                ('type_visite', 'aptitude'),
                ('entete_certificat_medical_aptitude', 'entete_reprise_au_poste'),
                ('avis_etat_general_efficience', 'avis_debout_prolonge'),
                ('avis_assis_prolonge', 'avis_charge_sup_4kg'),
                ('avis_poignet_bras_epaule', 'avis_cou'),
                ('avis_effort_precision_concentration', 'avis_rotation_equipe_possible'),
                ('apc_maladie_professionnelle', 'apc_accident_travail_sequelles', 'apc_maladies_chroniques'),
                ('zone_coupe_coupe', 'zone_coupe_sertissage_manuel', 'zone_coupe_autres_remarques'),
                ('zone_prep_epissure', 'zone_prep_retreint', 'zone_prep_torsadage', 'zone_prep_eiamage'),
                ('zone_prep_kabatec', 'zone_prep_lovage', 'zone_prep_autres_remarques'),
                ('zone_montage_sous_element', 'zone_montage_lad', 'zone_montage_pu', 'zone_montage_c_agrafs'),
                ('zone_montage_vissage', 'zone_montage_goulotte', 'zone_montage_bol', 'zone_montage_c_final'),
                ('zone_montage_autre_postes',),
                ('autres_remarques',),
            )
        }),
    )


@admin.register(CertificatAptitude)
class CertificatAptitudeAdmin(admin.ModelAdmin):
    
    list_display = [
        'fiche_aptitude',
        'date_emission',
    ]
    
    search_fields = [
        'fiche_aptitude__collaborateur__matricule',
        'description'
    ]
    
    list_filter = [
        'date_emission'
    ]
    
    ordering = ['-date_emission']
    
    fieldsets = (
        ('📄 Certificat', {
            'fields': (
                'fiche_aptitude',
                'date_emission',
                'description'
            )
        }),
    )

    inlines = [CertificatAptitudeMateurInline]