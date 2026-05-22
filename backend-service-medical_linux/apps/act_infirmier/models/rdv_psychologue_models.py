from django.conf import settings
from django.db import models


class RendezVousPsychologue(models.Model):
    """Enregistrement des rendez-vous avec le psychologue du travail."""

    collaborateur = models.ForeignKey(
        "employees.Collaborateur",
        on_delete=models.PROTECT,
        related_name="rdv_psychologue",
    )
    # Auto-rempli depuis le collaborateur (dénormalisé pour historique)
    segment = models.CharField(max_length=150, blank=True, verbose_name="Segment")
    service = models.CharField(max_length=150, blank=True, verbose_name="Service")
    position = models.CharField(
        max_length=150, blank=True, verbose_name="Position/Poste/Fonction"
    )
    secteur_collaborateur = models.CharField(
        max_length=150,
        blank=True,
        verbose_name="Secteur collaborateur",
    )
    site = models.ForeignKey(
        "account.Site",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="rdv_psychologue_entries",
    )
    superieur_hierarchique = models.CharField(
        max_length=200, blank=True, verbose_name="Supérieur hiérarchique"
    )
    num_tel = models.CharField(max_length=20, blank=True, verbose_name="Numéro de téléphone")

    date_rdv = models.DateField(verbose_name="Date du rendez-vous")

    infirmiere = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="rdv_psychologue_saisis",
        editable=False,
    )
    date_creation = models.DateTimeField(auto_now_add=True, editable=False)

    class Meta:
        ordering = ["-date_rdv"]
        verbose_name = "RDV Psychologue du travail"
        verbose_name_plural = "RDV Psychologues du travail"

    def __str__(self):
        return f"{self.collaborateur} - RDV {self.date_rdv}"

    def save(self, *args, **kwargs):
        if self.collaborateur:
            self.segment = self.collaborateur.segment
            self.service = self.collaborateur.department
            self.position = self.collaborateur.poste
            self.secteur_collaborateur = self.collaborateur.plant_section
            self.superieur_hierarchique = self.collaborateur.superieur_hierarchique
            self.num_tel = self.collaborateur.telephone

        if self.infirmiere:
            profile = getattr(self.infirmiere, "profile", None)
            infirmier = getattr(profile, "infirmier", None)
            site = getattr(infirmier, "site", None)
            if site:
                self.site = site

        super().save(*args, **kwargs)
