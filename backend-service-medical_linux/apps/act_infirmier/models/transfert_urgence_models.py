from django.conf import settings
from django.db import models


class TransfertUrgence(models.Model):
    date = models.DateField()
    heure = models.CharField(max_length=20)
    site = models.ForeignKey(
        'account.Site',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transferts_urgence',
    )
    chauffeur = models.CharField(max_length=255, verbose_name="Nom & Prenom du chauffeur")
    telephone_chauffeur = models.CharField(
        max_length=30,
        blank=True,
        verbose_name="Téléphone du chauffeur (SMS)",
        help_text="Numéro pour notification SMS lors du transfert aux urgences.",
    )
    sms_chauffeur_envoye = models.BooleanField(
        default=False,
        verbose_name="SMS chauffeur envoyé",
    )
    depart = models.CharField(max_length=255)
    destination = models.CharField(max_length=255)
    num_ordre = models.PositiveIntegerField(default=0, editable=False, verbose_name="N Ordre de Transport")
    plant = models.CharField(max_length=150)
    frais_deplacement = models.DecimalField(max_digits=10, decimal_places=2, default="0.00")
    cost_center = models.CharField(max_length=150)

    collaborateur = models.ForeignKey(
        "employees.Collaborateur",
        on_delete=models.PROTECT,
        related_name="transferts_urgence",
    )
    infirmiere = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="transferts_urgence_saisis",
        editable=False,
    )
    date_creation = models.DateTimeField(auto_now_add=True, editable=False)

    class Meta:
        ordering = ["-date", "-date_creation"]
        verbose_name = "Transfert urgence"
        verbose_name_plural = "Transferts urgence"

    def __str__(self):
        return f"{self.collaborateur} - {self.date} {self.heure}"

    def save(self, *args, **kwargs):
        """Génère automatiquement num_ordre à la création si pas déjà défini."""
        if self.pk is None:  # Nouvelle instance
            max_ordre = TransfertUrgence.objects.all().aggregate(models.Max('num_ordre'))['num_ordre__max']
            self.num_ordre = (max_ordre or 0) + 1
        super().save(*args, **kwargs)
