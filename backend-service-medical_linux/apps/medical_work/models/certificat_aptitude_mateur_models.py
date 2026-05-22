from django.db import models
from apps.account.models import Medecin
from apps.employees.models import Collaborateur
from .certificat_aptitude_models import CertificatAptitude


class CertificatAptitudeMateur(models.Model):
    """
    Payload structuré spécifique au site Mateur pour le certificat d'aptitude.
    Stocke les champs du nouveau formulaire (avis, zones, remarques, etc.).
    """

    certificat = models.OneToOneField(
        CertificatAptitude,
        on_delete=models.CASCADE,
        related_name="mateur_payload",
        verbose_name="Certificat d'Aptitude",
    )

    # Relations directes pour facilier l'analyse en DB (Workbench) / reporting.
    # NOTE: pour les fiches "embauche" (collaborateur = null), ce champ peut rester null.
    collaborateur = models.ForeignKey(
        Collaborateur,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
        verbose_name="Collaborateur",
    )
    medecin_travail = models.ForeignKey(
        Medecin,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
        verbose_name="Médecin du Travail",
    )

    # Meta (copie pour recherche/filtre facile)
    type_visite = models.CharField(max_length=30, blank=True, default="", verbose_name="Type de visite")
    aptitude = models.CharField(max_length=30, blank=True, default="", verbose_name="Aptitude")
    entete_certificat_medical_aptitude = models.BooleanField(default=True, verbose_name="En-tête - Certificat médicale d'aptitude")
    entete_reprise_au_poste = models.BooleanField(default=False, verbose_name="En-tête - Reprise au poste de travail")

    # Avis service médecine du travail (tous en texte libre)
    avis_etat_general_efficience = models.TextField(blank=True, default="", verbose_name="Etat général efficience")
    avis_debout_prolonge = models.TextField(blank=True, default="", verbose_name="Debout prolongé")
    avis_assis_prolonge = models.TextField(blank=True, default="", verbose_name="Assis prolongé")
    avis_charge_sup_4kg = models.TextField(blank=True, default="", verbose_name="Charge > 4 kgr")
    avis_poignet_bras_epaule = models.TextField(blank=True, default="", verbose_name="Poignet / Bras / Epaule")
    avis_cou = models.TextField(blank=True, default="", verbose_name="Cou")
    avis_effort_precision_concentration = models.TextField(blank=True, default="", verbose_name="Effort / précision / concentration")
    avis_rotation_equipe_possible = models.TextField(blank=True, default="", verbose_name="Rotation équipe possible")

    # A prendre en considération (texte libre)
    apc_maladie_professionnelle = models.TextField(blank=True, default="", verbose_name="Maladie professionnelle")
    apc_accident_travail_sequelles = models.TextField(blank=True, default="", verbose_name="Accident travail avec séquelles")
    apc_maladies_chroniques = models.TextField(blank=True, default="", verbose_name="Maladies chroniques")

    # Zones
    zone_coupe_coupe = models.TextField(blank=True, default="", verbose_name="Zone Coupe - Coupe")
    zone_coupe_sertissage_manuel = models.TextField(blank=True, default="", verbose_name="Zone Coupe - Sertissage manuel")
    zone_coupe_autres_remarques = models.TextField(blank=True, default="", verbose_name="Zone Coupe - Autres remarques")

    zone_prep_epissure = models.TextField(blank=True, default="", verbose_name="Zone Préparation - Epissure")
    zone_prep_retreint = models.TextField(blank=True, default="", verbose_name="Zone Préparation - Retreint")
    zone_prep_torsadage = models.TextField(blank=True, default="", verbose_name="Zone Préparation - Torsadage")
    zone_prep_eiamage = models.TextField(blank=True, default="", verbose_name="Zone Préparation - Eiamage")
    zone_prep_kabatec = models.TextField(blank=True, default="", verbose_name="Zone Préparation - Kabatec")
    zone_prep_lovage = models.TextField(blank=True, default="", verbose_name="Zone Préparation - Lovage")
    zone_prep_autres_remarques = models.TextField(blank=True, default="", verbose_name="Zone Préparation - Autres remarques")

    zone_montage_sous_element = models.TextField(blank=True, default="", verbose_name="Zone Montage - Sous élément")
    zone_montage_lad = models.TextField(blank=True, default="", verbose_name="Zone Montage - Montage LAD")
    zone_montage_pu = models.TextField(blank=True, default="", verbose_name="Zone Montage - PU")
    zone_montage_c_agrafs = models.TextField(blank=True, default="", verbose_name="Zone Montage - C. Agrafs")
    zone_montage_vissage = models.TextField(blank=True, default="", verbose_name="Zone Montage - Vissage")
    zone_montage_goulotte = models.TextField(blank=True, default="", verbose_name="Zone Montage - Montage goulotte")
    zone_montage_bol = models.TextField(blank=True, default="", verbose_name="Zone Montage - BOL")
    zone_montage_c_final = models.TextField(blank=True, default="", verbose_name="Zone Montage - C. Final")
    zone_montage_autre_postes = models.TextField(blank=True, default="", verbose_name="Zone Montage - Autre postes montage")

    autres_remarques = models.TextField(blank=True, default="", verbose_name="Autres remarques")

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "certificats_aptitude_mateur"
        verbose_name = "Certificat d'Aptitude (Mateur)"
        verbose_name_plural = "Certificats d'Aptitude (Mateur)"
        ordering = ["-date_modification"]

    def __str__(self):
        return f"Mateur payload certificat {self.certificat_id}"

