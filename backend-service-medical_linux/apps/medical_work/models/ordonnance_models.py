from django.db import models

from .fiche_aptitude_models import FicheAptitude


class Ordonnance(models.Model):
    fiche_aptitude = models.ForeignKey(
        FicheAptitude,
        on_delete=models.CASCADE,
        related_name="ordonnances",
        verbose_name="Fiche d'Aptitude",
    )
    date_ordonnance = models.DateField(verbose_name="Date ordonnance")
    prescription = models.TextField(blank=True, default="", verbose_name="Prescription")
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ordonnances"
        verbose_name = "Ordonnance"
        verbose_name_plural = "Ordonnances"
        ordering = ["-date_ordonnance", "-id"]

    def __str__(self):
        return f"Ordonnance {self.fiche_aptitude_id} - {self.date_ordonnance}"
