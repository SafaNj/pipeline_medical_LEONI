from django.conf import settings
from django.db import models


class IncidentAvecBon(models.Model):
    """Incident nécessitant une évacuation externe — un bon de sortie officiel est émis."""

    collaborateur = models.ForeignKey(
        "employees.Collaborateur",
        on_delete=models.PROTECT,
        related_name="incidents_avec_bon",
    )
    site = models.ForeignKey(
        "account.Site",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="incidents_avec_bon",
    )

    segment = models.CharField(max_length=150, blank=True, verbose_name="Segment")
    plant_section = models.CharField(max_length=150, blank=True, verbose_name="Plant/Section")

    date_bon = models.DateField(verbose_name="Date du bon")
    num_assurance = models.CharField(max_length=100, verbose_name="N° Assurance / CNAM")
    date_incident = models.DateField(verbose_name="Date de l'incident")
    destination = models.CharField(max_length=255, verbose_name="Destination")
    cause = models.CharField(max_length=255, verbose_name="Cause")
    lesion = models.TextField(verbose_name="Lésion / Description de la blessure")

    incident_origine = models.ForeignKey(
        "act_infirmier.IncidentSansBon",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="bons_sortie",
        verbose_name="Incident sans bon (origine)",
    )

    infirmiere = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="incidents_avec_bon_saisis",
        editable=False,
    )
    date_creation = models.DateTimeField(auto_now_add=True, editable=False)

    class Meta:
        ordering = ["-date_bon", "-date_creation"]
        verbose_name = "Incident avec bon de sortie"
        verbose_name_plural = "Incidents avec bon de sortie"

    def __str__(self):
        return f"{self.collaborateur} - {self.date_bon} → {self.destination}"
