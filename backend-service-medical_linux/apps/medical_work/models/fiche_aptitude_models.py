from django.db import models
from apps.employees.models import Collaborateur
from apps.account.models import Medecin

class FicheAptitude(models.Model):

    TYPE_VISITE_CHOICES = [
        ('EMBAUCHE', "Visite d'Embauche"),
        ('PERIODIQUE', "Visite Périodique"),
        ('REPRISE', "Visite de Reprise"),
        ('SPONTANEE', "Visite Spontanée"),
        ('SURVEILLANCE_SPECIALE', "Surveillance médicale spéciale"),
    ]

    APTITUDE_CHOICES = [
        ('APTE_AU_POSTE', 'APTE_AU_POSTE'),
        ('APTE_AMENAGEMENT_POSTE', 'APTE_AMENAGEMENT_POSTE'),
        ('INAPTE_TEMPORAIRE', 'Inapte temporaire'),
        ('INAPTE_DEFINITIF_MEME_POSTE', 'INAPTE_DEFINITIF_MEME_POSTE'),
        ('INAPTE_DEFINITIF_ENTREPRISE', 'INAPTE_DEFINITIF_ENTREPRISE'),
        ('aptitude', 'aptitude'),
        ('reprise_mo_at', 'reprise_mo_at'),
        ('aptitude_temporaire', 'aptitude_temporaire'),
    ]

    # Relations
    collaborateur = models.ForeignKey(
        Collaborateur,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='fiches_aptitude',
        verbose_name="Collaborateur"
    )
    medecin_travail = models.ForeignKey(
        Medecin,
        on_delete=models.PROTECT,
        related_name='fiches_creees',
        verbose_name="Médecin du Travail"
    )
    ligne_visite_periodique = models.ForeignKey(
        "visites_periodiques.LigneVisitePeriodique",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
        verbose_name="Ligne visite périodique",
    )
    ligne_surveillance_speciale = models.ForeignKey(
        "surveillance_speciale.LigneSurveillanceSpeciale",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="fiches_aptitude",
        verbose_name="Ligne surveillance médicale spéciale",
    )

    # Section Entreprise
    raison_sociale = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="Raison sociale"
    )
    nature_activite = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="Nature d'activité"
    )
    adresse_entreprise = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="Adresse entreprise"
    )
    site = models.ForeignKey(
        'account.Site',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='fiches_aptitude',
        verbose_name='Site',
    )

    # CNSS Entreprise
    numero_cnss_entreprise = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Numéro CNSS Entreprise"
    )

    qualifications = models.TextField(
        blank=True,
        verbose_name="Qualifications"
    )

    # Visite
    date_visite = models.DateField(
        verbose_name="Date de visite"
    )
    type_visite = models.CharField(
        max_length=30,
        choices=TYPE_VISITE_CHOICES,
        verbose_name="Type de visite"
    )

    # Snapshot matricule — utilisé pour les visites d'embauche
    # quand collaborateur=null (le collaborateur n'est pas encore créé dans medical_db).
    # Permet au serializer de retrouver les données im_db sans collaborateur lié.
    matricule = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Matricule (snapshot embauche)"
    )

    # CNSS du salarié (saisie médecin du travail) — distinct du numéro CNSS entreprise
    numero_cnss = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Numéro CNSS (salarié)",
    )

    # Aptitude
    aptitude = models.CharField(
        max_length=30,
        choices=APTITUDE_CHOICES,
        verbose_name="Aptitude"
    )
    precision_aptitude = models.TextField(
        blank=True,
        verbose_name="Précision aptitude"
    )
    observations_complementaires = models.TextField(
        blank=True,
        null=True,
        verbose_name="Observations complémentaires",
    )
    duree_aptitude = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Et ce pour une durée de",
    )
    periode_temporaire = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Pour une période de",
    )
    date_reprise = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        default="",
        verbose_name="Peut reprendre son travail à dater du",
    )

    # Suivi visite périodique
    # NB: présent en base (migrations), nécessaire pour les alertes RH (J-30).
    date_prochaine_visite = models.DateField(
        null=True,
        blank=True,
        verbose_name="Date prochaine visite",
    )
    validite_mois = models.IntegerField(
        default=12,
        verbose_name="Validité (mois)",
    )
    envoyee_rh = models.BooleanField(
        default=False,
        verbose_name="Envoyée au RH",
    )
    date_envoi_rh = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date envoi RH",
    )

    # Système
    date_creation = models.DateTimeField(auto_now_add=True)

    # --- MATEUR / impression Annexe 3 (page 2) ---
    # Stockage des lignes "4. Examens médicaux ultérieurs" (P/R/S + textes).
    examens_ulterieurs = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Examens médicaux ultérieurs (JSON)",
    )

    class Meta:
        db_table = 'fiches_aptitude'
        verbose_name = "Fiche d'Aptitude"
        verbose_name_plural = "Fiches d'Aptitude"
        ordering = ['-date_visite']

    def __str__(self):
        if self.collaborateur_id:
            target = str(self.collaborateur)
        else:
            target = 'Sans collaborateur'
        return f"Fiche {target} - {self.date_visite.strftime('%d/%m/%Y')}"