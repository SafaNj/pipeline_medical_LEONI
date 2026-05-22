from django.conf import settings
from django.db import models


class OrdreTransport(models.Model):
    transfert = models.OneToOneField(
        "act_infirmier.TransfertUrgence",
        on_delete=models.CASCADE,
        related_name="ordre_transport",
        verbose_name="Transfert d'urgence"
    )
    medecin = models.ForeignKey(
        "account.Medecin",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="ordres_transport",
        verbose_name="Médecin prescripteur"
    )
    site = models.ForeignKey(
        "account.Site",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ordres_transport",
        verbose_name="Site",
    )
    infirmier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="ordres_transport_saisis",
        editable=False,
        verbose_name="Infirmier/ère"
    )
    motif = models.TextField(blank=True, verbose_name="Motif du transfert")
    accompagnant = models.CharField(
        max_length=200, blank=True,
        verbose_name="Accompagnant"
    )
    moyen_transport = models.CharField(
        max_length=100, blank=True,
        verbose_name="Moyen de transport"
    )
    montant_prime = models.DecimalField(
        max_digits=8, decimal_places=2,
        null=True, blank=True,
        verbose_name="Montant prime"
    )
    date_creation = models.DateTimeField(auto_now_add=True, editable=False)

    class Meta:
        ordering = ["-transfert__date", "-date_creation"]
        verbose_name = "Ordre de transport"
        verbose_name_plural = "Ordres de transport"

    def __str__(self):
        return f"Ordre #{self.transfert.num_ordre} — {self.transfert.collaborateur}"
