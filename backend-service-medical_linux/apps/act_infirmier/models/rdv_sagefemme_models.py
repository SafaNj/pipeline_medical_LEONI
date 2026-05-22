from django.conf import settings
from django.db import models


class RendezVousSagefemme(models.Model):
    """Enregistrement des rendez-vous avec la sage-femme."""

    collaborateur = models.ForeignKey(
        "employees.Collaborateur",
        on_delete=models.PROTECT,
        related_name="rdv_sagefemme",
    )
    # Auto-rempli depuis le collaborateur (dénormalisé pour historique)
    segment = models.CharField(max_length=150, blank=True, verbose_name="Segment")
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
        related_name="rdv_sagefemme_entries",
    )
    num_tel = models.CharField(max_length=20, blank=True, verbose_name="Numéro de téléphone")
    motif_rdv = models.CharField(max_length=255, blank=True, verbose_name="Motif du rendez-vous")

    date_rdv = models.DateField(verbose_name="Date du rendez-vous")
    commentaire = models.TextField(blank=True, verbose_name="Commentaire")

    infirmiere = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="rdv_sagefemme_saisis",
        editable=False,
    )
    date_creation = models.DateTimeField(auto_now_add=True, editable=False)

    class Meta:
        ordering = ["-date_rdv"]
        verbose_name = "RDV Sage-femme"
        verbose_name_plural = "RDV Sages-femmes"

    def __str__(self):
        return f"{self.collaborateur} - RDV Sage-femme {self.date_rdv}"

    def save(self, *args, **kwargs):
        if self.collaborateur:
            self.segment = self.collaborateur.segment
            self.secteur_collaborateur = self.collaborateur.plant_section
            self.num_tel = self.collaborateur.telephone

        if self.infirmiere:
            profile = getattr(self.infirmiere, "profile", None)
            infirmier = getattr(profile, "infirmier", None)
            site = getattr(infirmier, "site", None)
            if site:
                self.site = site

        super().save(*args, **kwargs)
