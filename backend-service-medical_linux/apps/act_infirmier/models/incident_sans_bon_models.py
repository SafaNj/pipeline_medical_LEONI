from django.conf import settings
from django.db import models


class IncidentSansBon(models.Model):
    """Incident mineur traité sur place à l'infirmerie, sans évacuation externe."""

    collaborateur = models.ForeignKey(
        "employees.Collaborateur",
        on_delete=models.PROTECT,
        related_name="incidents_sans_bon",
    )
    site = models.ForeignKey(
        "account.Site",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="incidents_sans_bon",
    )
    # Auto-rempli depuis le collaborateur (dénormalisé pour historique)
    segment = models.CharField(max_length=150, blank=True, verbose_name="Segment")
    plant_section = models.CharField(max_length=150, blank=True, verbose_name="Plant/Section")

    date_incident = models.DateField(verbose_name="Date de l'incident")
    heure_incident = models.TimeField(verbose_name="Heure d'arrivée à l'infirmerie")

    mode_lesion = models.TextField(verbose_name="Mode de lésion")
    agent_causal = models.CharField(max_length=255, verbose_name="Agent causal")
    remarque = models.TextField(blank=True, verbose_name="Remarque / Soin effectué")

    infirmiere = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="incidents_sans_bon_saisis",
        editable=False,
    )
    date_creation = models.DateTimeField(auto_now_add=True, editable=False)

    class Meta:
        ordering = ["-date_incident", "-date_creation"]
        verbose_name = "Incident sans bon de sortie"
        verbose_name_plural = "Incidents sans bon de sortie"

    def __str__(self):
        return f"{self.collaborateur} - {self.date_incident} {self.heure_incident}"
