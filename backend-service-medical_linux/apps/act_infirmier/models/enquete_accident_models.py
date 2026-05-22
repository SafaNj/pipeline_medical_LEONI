from django.conf import settings
from django.db import models

from apps.act_infirmier.models.accident_travail_models import AccidentTravail


class EnqueteAccident(models.Model):
    """
    Complément d'enquête pour un accident du travail (formulaire Word).
    Les données victime/accident de base restent sur AccidentTravail.
    """

    accident = models.OneToOneField(
        AccidentTravail,
        on_delete=models.CASCADE,
        related_name="enquete",
        verbose_name="Accident de travail",
    )
    telephone_victime = models.CharField(max_length=20, blank=True, verbose_name="Téléphone victime")
    appartenance = models.CharField(
        max_length=150,
        blank=True,
        verbose_name="Appartenance (service / département)",
    )
    horaire_travail = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Horaire de travail",
        help_text='Ex. "06h–14h", journée complète',
    )
    circonstances = models.TextField(blank=True, verbose_name="Circonstances détaillées")
    lieu_transport = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="Lieu de transport de la victime",
    )
    temoins = models.JSONField(default=list, blank=True, verbose_name="Témoins")

    redige_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="enquetes_accident_redigees",
        verbose_name="Rédigé par",
    )
    date_redaction = models.DateTimeField(auto_now_add=True, verbose_name="Date de rédaction")
    date_modification = models.DateTimeField(auto_now=True, verbose_name="Dernière modification")

    class Meta:
        db_table = "enquetes_accident"
        verbose_name = "Enquête accident du travail"
        verbose_name_plural = "Enquêtes accidents du travail"

    def __str__(self):
        return f"Enquête — accident #{self.accident_id}"
