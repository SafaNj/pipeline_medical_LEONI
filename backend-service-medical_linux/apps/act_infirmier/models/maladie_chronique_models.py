from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class MaladieChronique(models.Model):
    """Enregistrement des maladies chroniques d'un collaborateur."""

    MALADIE_CHOICES = (
        ("Diabète", "Diabète"),
        ("Hypertension", "Hypertension"),
        ("Asthme", "Asthme"),
        ("Insuffisance rénale", "Insuffisance rénale"),
        ("Épilepsie", "Épilepsie"),
        ("Autre", "Autre"),
    )

    collaborateur = models.ForeignKey(
        "employees.Collaborateur",
        on_delete=models.PROTECT,
        related_name="maladies_chroniques",
    )
    site = models.ForeignKey(
        "account.Site",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="maladies_chroniques",
    )
    # Auto-rempli depuis le collaborateur (dénormalisé pour historique)
    segment = models.CharField(max_length=150, blank=True, verbose_name="Segment")

    date_declaration = models.DateField(verbose_name="Date de déclaration")
    type_maladie = models.CharField(
        max_length=50,
        choices=MALADIE_CHOICES,
        verbose_name="Type de maladie",
    )
    type_maladie_autre = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="Type de maladie (autre)",
    )
    num_tel = models.CharField(max_length=20, blank=True, verbose_name="Numéro de téléphone")
    commentaire = models.TextField(blank=True, verbose_name="Commentaire")

    infirmiere = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="maladies_chroniques_saisies",
        editable=False,
    )
    date_creation = models.DateTimeField(auto_now_add=True, editable=False)

    class Meta:
        ordering = ["-date_declaration"]
        verbose_name = "Maladie chronique"
        verbose_name_plural = "Maladies chroniques"

    def __str__(self):
        return f"{self.collaborateur} - {self.type_maladie} ({self.date_declaration})"

    def clean(self):
        type_autre = (self.type_maladie_autre or "").strip()
        if self.type_maladie == "Autre" and not type_autre:
            raise ValidationError(
                {"type_maladie_autre": "Veuillez préciser la maladie si vous choisissez 'Autre'."}
            )
        if self.type_maladie != "Autre":
            self.type_maladie_autre = ""

    def save(self, *args, **kwargs):
        self.clean()
        if self.collaborateur:
            self.segment = self.collaborateur.segment
            if self._state.adding and not self.num_tel:
                self.num_tel = self.collaborateur.telephone
        super().save(*args, **kwargs)
