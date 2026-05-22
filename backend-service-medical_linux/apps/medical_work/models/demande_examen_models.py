from datetime import date

from django.db import models
from .fiche_aptitude_models import FicheAptitude


class DemandeExamen(models.Model):

    fiche_aptitude = models.ForeignKey(
        FicheAptitude,
        on_delete=models.CASCADE,
        related_name='demandes_examen',
        verbose_name="Fiche d'Aptitude",
        null=True,
        blank=True,
    )

    numero_examen = models.CharField(
        max_length=20,
        blank=True,
        default="",
        editable=False,
        verbose_name="N° Examen"
    )

    date_demande = models.DateField(
        verbose_name="Date de demande"
    )

    # Cases à cocher — Renseignements complémentaires
    visiotest = models.BooleanField(
        default=False, verbose_name="Visiotest"
    )
    audiogramme = models.BooleanField(
        default=False, verbose_name="Audiogramme"
    )
    ecg = models.BooleanField(
        default=False, verbose_name="ECG"
    )
    efr = models.BooleanField(
        default=False, verbose_name="EFR"
    )

    # Champs spécifiques formulaire FOR-AMT-06 (Sousse)
    risque_physique = models.BooleanField(default=False, blank=True, verbose_name="Risque physique")
    risque_chimique = models.BooleanField(default=False, blank=True, verbose_name="Risque chimique")
    risque_infectieux = models.BooleanField(default=False, blank=True, verbose_name="Risque infectieux")
    risque_chauffeur = models.BooleanField(default=False, blank=True, verbose_name="Risque chauffeur")
    spirometrie = models.BooleanField(default=False, blank=True, verbose_name="Spirométrie")
    microfilm = models.BooleanField(default=False, blank=True, verbose_name="Microfilm")

    renseignements_cliniques = models.TextField(
        blank=True,
        default="",
        verbose_name="Renseignements cliniques",
    )

    class Meta:
        db_table = 'demandes_examen'
        verbose_name = "Demande d'Examen"
        verbose_name_plural = "Demandes d'Examen"
        ordering = ['-date_demande']

    def save(self, *args, **kwargs):
        if not self.numero_examen:
            current_year = self.date_demande.year if self.date_demande else date.today().year
            prefix = f"EX-{current_year}-"
            last_record = (
                DemandeExamen.objects
                .filter(numero_examen__startswith=prefix)
                .order_by('-numero_examen')
                .first()
            )

            if last_record and last_record.numero_examen:
                try:
                    last_sequence = int(last_record.numero_examen.split('-')[-1])
                except (ValueError, IndexError):
                    last_sequence = 0
            else:
                last_sequence = 0

            self.numero_examen = f"{prefix}{last_sequence + 1:03d}"

        super().save(*args, **kwargs)

    def __str__(self):
        return self.numero_examen or f"Examen {self.fiche_aptitude_id} - {self.date_demande}"
