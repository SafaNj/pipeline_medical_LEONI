from django.conf import settings
from django.db import models


class PointageMedecin(models.Model):
    medecin = models.ForeignKey(
        "account.Medecin",
        on_delete=models.PROTECT,
        related_name="pointages",
    )
    date = models.DateField()
    heures_travaillees = models.PositiveIntegerField(default=2)
    remarque = models.TextField(blank=True)

    mois = models.PositiveIntegerField(editable=False)
    annee = models.PositiveIntegerField(editable=False)

    infirmiere = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="pointages_medecin_saisis",
        editable=False,
    )
    date_creation = models.DateTimeField(auto_now_add=True, editable=False)

    class Meta:
        ordering = ["-date"]
        unique_together = [["medecin", "date"]]
        verbose_name = "Pointage médecin"
        verbose_name_plural = "Pointages médecins"

    def save(self, *args, **kwargs):
        self.mois = self.date.month
        self.annee = self.date.year
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.medecin} - {self.date} ({self.heures_travaillees}h)"
