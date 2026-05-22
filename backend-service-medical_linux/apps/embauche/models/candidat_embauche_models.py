from django.db import models
from django.db.models.signals import pre_save
from django.dispatch import receiver

from apps.employees.models import Collaborateur
from apps.medical_work.models import FicheAptitude


class CandidatEmbauche(models.Model):
    PRESENCE_NON_RENSEIGNEE = 'NON_RENSEIGNEE'
    PRESENCE_PRESENT = 'PRESENT'
    PRESENCE_ABSENT = 'ABSENT'

    PRESENCE_CHOICES = [
        (PRESENCE_NON_RENSEIGNEE, 'Non renseignee'),
        (PRESENCE_PRESENT, 'Present'),
        (PRESENCE_ABSENT, 'Absent'),
    ]

    ETAT_EN_ATTENTE = 'EN_ATTENTE'
    ETAT_APTE = 'APTE'
    ETAT_INAPTE = 'INAPTE'

    ETAT_EMBAUCHE_CHOICES = [
        (ETAT_EN_ATTENTE, 'En attente'),
        (ETAT_APTE, 'Apte'),
        (ETAT_INAPTE, 'Inapte'),
    ]

    STATUT_INTEGRATION_EN_ATTENTE_VISITE = 'EN_ATTENTE_VISITE'
    # Statut legacy conservé pour compatibilité avec d'anciens enregistrements/flux.
    # Le flux actuel passe directement de EN_ATTENTE_VISITE à INTEGRE après création collaborateur.
    STATUT_INTEGRATION_EN_FORMATION = 'EN_FORMATION'
    STATUT_INTEGRATION_INTEGRE = 'INTEGRE'
    STATUT_INTEGRATION_NON_RETENU = 'NON_RETENU'

    STATUT_INTEGRATION_CHOICES = [
        (STATUT_INTEGRATION_EN_ATTENTE_VISITE, 'En attente visite'),
        (STATUT_INTEGRATION_EN_FORMATION, 'En formation'),
        (STATUT_INTEGRATION_INTEGRE, 'Integre'),
        (STATUT_INTEGRATION_NON_RETENU, 'Non retenu'),
    ]

    GENRE_CHOICES = [
        ('homme', 'Homme'),
        ('femme', 'Femme'),
    ]

    liste = models.ForeignKey(
        'embauche.ListeEmbauche',
        on_delete=models.CASCADE,
        related_name='candidats',
    )
    ligne_source = models.PositiveIntegerField(default=0)

    # ── Champs identité ──────────────────────────────────────
    matricule = models.CharField(max_length=50)
    nom = models.CharField(max_length=150)
    prenom = models.CharField(max_length=150)
    cin = models.CharField(max_length=20, blank=True)
    numero_cnss = models.CharField(max_length=50, blank=True, verbose_name='N° CNSS')
    date_naissance = models.DateField(null=True, blank=True)
    genre = models.CharField(max_length=10, choices=GENRE_CHOICES, blank=True)
    telephone = models.CharField(max_length=30, blank=True)
    gouvernorat = models.CharField(max_length=100, blank=True)

    # ── Champs RH / recrutement ──────────────────────────────
    niveau = models.CharField(max_length=100, blank=True)
    num_demande = models.CharField(max_length=50, blank=True)
    ps = models.CharField(max_length=100, blank=True, verbose_name='PS')
    projet = models.CharField(max_length=100, blank=True)
    date_recrutement = models.DateField(null=True, blank=True)
    centre_cout = models.CharField(max_length=100, blank=True)
    poste = models.CharField(max_length=150, blank=True, verbose_name='Fonction')
    department = models.CharField(max_length=150, blank=True)
    source_information = models.CharField(max_length=200, blank=True)
    formation = models.CharField(max_length=100, blank=True)

    presence = models.CharField(
        max_length=20,
        choices=PRESENCE_CHOICES,
        default=PRESENCE_NON_RENSEIGNEE,
    )
    fiche_aptitude = models.ForeignKey(
        FicheAptitude,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='candidats_embauche',
    )
    etat_embauche = models.CharField(
        max_length=20,
        choices=ETAT_EMBAUCHE_CHOICES,
        default=ETAT_EN_ATTENTE,
    )
    statut_integration = models.CharField(
        max_length=30,
        choices=STATUT_INTEGRATION_CHOICES,
        default=STATUT_INTEGRATION_EN_ATTENTE_VISITE,
    )
    collaborateur = models.ForeignKey(
        Collaborateur,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='candidatures_embauche',
    )
    observations_medecin = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    sms_jour_j_envoye = models.BooleanField(
        default=False,
        verbose_name='SMS jour J (file) envoyé',
    )

    class Meta:
        ordering = ['liste_id', 'id']
        verbose_name = 'Candidat embauche'
        verbose_name_plural = 'Candidats embauche'

    def __str__(self):
        return f'{self.nom} {self.prenom} ({self.matricule})'


@receiver(pre_save, sender=CandidatEmbauche)
def update_etat_embauche_from_fiche(sender, instance, **kwargs):
    if not instance.fiche_aptitude_id:
        instance.etat_embauche = CandidatEmbauche.ETAT_EN_ATTENTE
        return

    aptitude = (instance.fiche_aptitude.aptitude or '').upper()
    if aptitude.startswith('APTE'):
        instance.etat_embauche = CandidatEmbauche.ETAT_APTE
    else:
        instance.etat_embauche = CandidatEmbauche.ETAT_INAPTE