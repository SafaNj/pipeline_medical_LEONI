from django.db import models


class EquipementMedicalEndommage(models.Model):
    """Signalement d'équipement médical endommagé (comptage mensuel HSEE)."""

    site = models.ForeignKey(
        "account.Site",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="equipements_medicaux_endommages",
    )
    date_constat = models.DateField()
    description = models.CharField(max_length=255, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date_constat"]
        verbose_name = "Équipement médical endommagé"
        verbose_name_plural = "Équipements médicaux endommagés"

    def __str__(self):
        return f"{self.date_constat} — {self.description or 'sans description'}"
