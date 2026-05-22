from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone


class MaladieProfessionnelle(models.Model):
    collaborateur = models.ForeignKey(
        "employees.Collaborateur",
        on_delete=models.PROTECT,
        related_name="maladies_professionnelles",
    )
    site = models.ForeignKey(
        "account.Site",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="maladies_professionnelles",
    )
    anciennete = models.PositiveIntegerField(default=0, editable=False, verbose_name="Ancienneté")
    plant_section = models.CharField(max_length=150, blank=True)
    segment = models.CharField(max_length=150)
    infirmiere = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="maladies_saisies",
        editable=False,
    )
    date_creation = models.DateTimeField(auto_now_add=True, editable=False)

    mois = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(12)])
    date_debut_maladie = models.DateField()
    maladie = models.CharField(max_length=255)
    is_tms = models.BooleanField(default=False, verbose_name="Trouble Musculo-Squelettique (TMS)")
    code_tableau_cnam = models.CharField(max_length=50)
    cause = models.CharField(max_length=255)

    nature_travail = models.CharField(max_length=255)
    changement_poste = models.BooleanField(default=False)
    ancien_poste = models.CharField(max_length=255, blank=True)
    nouveau_poste = models.CharField(max_length=255, blank=True)

    decision_medecin = models.CharField(max_length=255)
    repos_initial = models.PositiveIntegerField(default=0)
    prolongation = models.PositiveIntegerField(default=0)
    rechute = models.PositiveIntegerField(default=0)
    repos_total = models.PositiveIntegerField(default=0, editable=False)
    reprise_medecin_traitant = models.BooleanField(default=False)
    reprise_medecin_travail = models.DateField(null=True, blank=True)

    date_declaration_service_medical = models.DateField()
    date_sortie_declaration = models.CharField(max_length=255, blank=True)
    chauffeur_sortie = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-date_debut_maladie", "-date_creation"]
        verbose_name = "Maladie professionnelle"
        verbose_name_plural = "Maladies professionnelles"

    def save(self, *args, **kwargs):
        if self.collaborateur and self.collaborateur.date_embauche:
            self.anciennete = max(0, timezone.localdate().year - self.collaborateur.date_embauche.year)
        else:
            self.anciennete = 0
        self.repos_total = (self.repos_initial or 0) + (self.prolongation or 0) + (self.rechute or 0)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.collaborateur} - {self.maladie} - {self.date_debut_maladie}"