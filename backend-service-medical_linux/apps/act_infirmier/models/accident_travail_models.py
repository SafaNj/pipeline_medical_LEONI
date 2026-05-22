from django.conf import settings
from django.db import models


class AccidentTravail(models.Model):
    CATEGORIE_TRAVAIL = "TRAVAIL"
    CATEGORIE_TRAJET = "TRAJET"
    CATEGORIE_CHOICES = [
        (CATEGORIE_TRAVAIL, "Accident de travail"),
        (CATEGORIE_TRAJET, "Accident de trajet"),
    ]

    collaborateur = models.ForeignKey(
        "employees.Collaborateur",
        on_delete=models.PROTECT,
        related_name="accidents_travail",
    )
    site = models.ForeignKey(
        "account.Site",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="accidents_travail",
    )
    num_cnam = models.CharField(max_length=50, blank=True, verbose_name="N°01")
    plant_section = models.CharField(
        max_length=150,
        blank=True,
        verbose_name="Plant / section",
        help_text="Zone ou section d’usine concernée par l’accident.",
    )
    infirmiere = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="accidents_saisis",
        editable=False,
    )
    date_creation = models.DateTimeField(auto_now_add=True, editable=False)

    date_accident = models.DateField()
    heure_accident = models.TimeField(null=True, blank=True)
    categorie_accident = models.CharField(
        max_length=20,
        choices=CATEGORIE_CHOICES,
        default=CATEGORIE_TRAVAIL,
        verbose_name="Catégorie",
        help_text="Travail ou trajet — utilisé pour les statistiques HSEE.",
    )
    type_accident = models.TextField(verbose_name="Accident du trajet")
    lieu_accident = models.CharField(max_length=255)
    description = models.TextField()

    siege_lesion = models.CharField(max_length=255)
    nature_lesion = models.CharField(max_length=255)
    cause_accident = models.CharField(max_length=255)
    agent_materiel = models.CharField(max_length=255, blank=True)
    temoins = models.TextField(blank=True)

    repos_initial = models.PositiveIntegerField(default=0)
    prolongation = models.PositiveIntegerField(default=0)
    total_jour_perdu = models.PositiveIntegerField(default=0, editable=False)

    CRITICITE_FAIBLE = "FAIBLE"
    CRITICITE_MODEREE = "MODEREE"
    CRITICITE_GRAVE = "GRAVE"
    CRITICITE_TRES_GRAVE = "TRES_GRAVE"
    CRITICITE_CHOICES = [
        (CRITICITE_FAIBLE, "Faible"),
        (CRITICITE_MODEREE, "Modérée"),
        (CRITICITE_GRAVE, "Grave"),
        (CRITICITE_TRES_GRAVE, "Très grave"),
    ]

    criticite = models.CharField(
        max_length=20,
        choices=CRITICITE_CHOICES,
        blank=True,
        verbose_name="Criticité",
    )
    reprise_medecin_travail = models.DateField(null=True, blank=True)

    date_declaration_service_medical = models.DateField()
    date_sortie_declaration = models.DateField(null=True, blank=True)
    chauffeur_sortie = models.CharField(max_length=255, blank=True)
    reporting_interne = models.BooleanField(default=False)
    reporting_wsd = models.BooleanField(default=False)

    class Meta:
        ordering = ["-date_accident", "-date_creation"]
        verbose_name = "Accident de travail"
        verbose_name_plural = "Accidents de travail"

    def save(self, *args, **kwargs):
        self.total_jour_perdu = (self.repos_initial or 0) + (self.prolongation or 0)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.collaborateur} - {self.type_accident} - {self.date_accident}"
