from django.db import models

from .fiche_aptitude_models import FicheAptitude


class FicheLiaison(models.Model):
    fiche_aptitude = models.ForeignKey(
        FicheAptitude,
        on_delete=models.CASCADE,
        related_name="fiches_liaison",
        verbose_name="Fiche d'Aptitude",
    )
    date_liaison = models.DateField(verbose_name="Date liaison")
    nom_patient = models.CharField(max_length=255, blank=True, default="", verbose_name="Nom patient")
    age_patient = models.IntegerField(null=True, blank=True, verbose_name="Age patient")
    employeur = models.CharField(max_length=255, blank=True, default="", verbose_name="Employeur")
    matricule = models.CharField(max_length=50, blank=True, default="", verbose_name="Matricule")
    message = models.TextField(blank=True, default="", verbose_name="Message")
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "fiches_liaison"
        verbose_name = "Fiche de Liaison"
        verbose_name_plural = "Fiches de Liaison"
        ordering = ["-date_liaison", "-id"]

    def __str__(self):
        return f"Fiche liaison {self.fiche_aptitude_id} - {self.date_liaison}"
