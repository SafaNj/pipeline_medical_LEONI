from django.db import models
from apps.employees.models import Collaborateur


GROUPE_SANGUIN_CHOICES = (
    ("A+", "A+"),
    ("A-", "A-"),
    ("B+", "B+"),
    ("B-", "B-"),
    ("AB+", "AB+"),
    ("AB-", "AB-"),
    ("O+", "O+"),
    ("O-", "O-"),
)


class DossierMedical(models.Model):
    # Lien avec le collaborateur (optionnel)
    collaborateur = models.OneToOneField(
        Collaborateur,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="dossier_medical",
    )
    matricule_ref = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        verbose_name='Matricule de reference',
    )
    site = models.ForeignKey(
        'account.Site',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dossiers_medicaux',
    )

    # Identification
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    date_naissance = models.DateField(null=True, blank=True)
    lieu_naissance = models.CharField(max_length=150, null=True, blank=True)
    adresse = models.TextField(null=True, blank=True)
    photo = models.ImageField(
        upload_to="dossiers/photos/",
        null=True,
        blank=True,
    )

    # Antécédents
    antecedents_medicaux = models.TextField(null=True, blank=True)
    antecedents_chirurgicaux = models.TextField(null=True, blank=True)
    antecedents_gyneco = models.TextField(null=True, blank=True)
    antecedents_familiaux = models.TextField(null=True, blank=True)

    # Vaccinations
    vaccin_tuberculose = models.DateField(null=True, blank=True)
    vaccin_tetanos = models.DateField(null=True, blank=True)
    vaccin_hepatite = models.DateField(null=True, blank=True)
    autres_vaccins = models.TextField(null=True, blank=True)

    # Groupe sanguin
    groupe_sanguin = models.CharField(
        max_length=3,
        choices=GROUPE_SANGUIN_CHOICES,
        null=True,
        blank=True,
    )

    # Allergies
    allergies = models.TextField(null=True, blank=True)
   
    # Habitudes
    tabac = models.BooleanField(default=False)
    alcool = models.BooleanField(default=False)
    automedication = models.BooleanField(default=False)

    # Métadonnées
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    

    def __str__(self):
        return f"Dossier de {self.nom} {self.prenom}"