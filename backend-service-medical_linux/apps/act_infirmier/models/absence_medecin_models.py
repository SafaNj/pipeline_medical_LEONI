from django.conf import settings
from django.db import models


class AbsenceMedecin(models.Model):
    medecin = models.ForeignKey(
        "account.Medecin",
        on_delete=models.PROTECT,
        related_name="absences",
    )
    site = models.ForeignKey(
        "account.Site",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="absences_medecins",
    )
    date = models.DateField()
    motif = models.TextField(blank=True)

    mois = models.PositiveIntegerField(editable=False)
    annee = models.PositiveIntegerField(editable=False)

    infirmiere = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="absences_medecin_saisies",
        editable=False,
    )
    date_creation = models.DateTimeField(auto_now_add=True, editable=False)

    class Meta:
        ordering = ["-date"]
        unique_together = [["medecin", "date"]]
        verbose_name = "Absence médecin"
        verbose_name_plural = "Absences médecins"

    def save(self, *args, **kwargs):
        self.mois = self.date.month
        self.annee = self.date.year
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.medecin} - absent le {self.date}"
