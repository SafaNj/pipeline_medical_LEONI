from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class ParametreHSEEMensuel(models.Model):
    """
    Paramètres mensuels pour les ratios HSEE (heures travaillées, effectif).
    Sans enregistrement pour un mois donné, les ratios dépendants sont null dans le dashboard.
    """

    annee = models.PositiveIntegerField()
    site = models.ForeignKey(
        "account.Site",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="parametres_hsee_mensuels",
    )
    mois = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(12)])
    heures_travaillees = models.PositiveBigIntegerField(
        default=0,
        help_text="Heures travaillées totales (entreprise) sur le mois — dénominateur des ratios × 200 000.",
    )
    effectif_travailleurs = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Effectif pour le ratio maladies professionnelles × 1000 (optionnel).",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["annee", "mois", "site"], name="uniq_parametre_hsee_annee_mois_site"),
        ]
        ordering = ["-annee", "-mois"]
        verbose_name = "Paramètre HSEE mensuel"
        verbose_name_plural = "Paramètres HSEE mensuels"

    def __str__(self):
        return f"HSEE {self.mois:02d}/{self.annee}"
