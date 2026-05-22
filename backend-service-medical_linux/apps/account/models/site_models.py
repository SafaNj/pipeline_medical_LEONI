from django.db import models


class Site(models.Model):
    class TemplateKey(models.TextChoices):
        MONASTIR = 'MONASTIR', 'Monastir'
        SOUSSE = 'SOUSSE', 'Sousse'
        MATEUR = 'MATEUR', 'Mateur'

    nom = models.CharField(max_length=150)
    nom_ar = models.CharField(max_length=150, blank=True)
    adresse = models.CharField(max_length=255, blank=True)
    telephone = models.CharField(max_length=30, blank=True)
    code = models.CharField(max_length=50, unique=True, null=True, blank=True)
    template_key = models.CharField(
        max_length=20,
        choices=TemplateKey.choices,
        default=TemplateKey.MONASTIR,
    )
    logo = models.ImageField(upload_to='sites/logos/', null=True, blank=True)
    numero_cnss = models.CharField(max_length=50, blank=True, verbose_name="Numéro CNSS")
    nature_activite = models.CharField(max_length=255, blank=True, verbose_name="Nature d'activité")
    raison_sociale = models.CharField(max_length=255, blank=True, verbose_name="Raison sociale")
    # Champs entreprise (saisie via Django Admin)
    numero_cnss_entreprise = models.CharField(
        max_length=50,
        blank=True,
        default="",
        verbose_name="Numéro CNSS Entreprise",
    )
    adresse_entreprise = models.TextField(
        blank=True,
        default="",
        verbose_name="Adresse entreprise",
    )
    qualifications = models.TextField(
        blank=True,
        default="",
        verbose_name="Qualifications",
    )

    class Meta:
        ordering = ['nom']

    def __str__(self):
        return self.nom
