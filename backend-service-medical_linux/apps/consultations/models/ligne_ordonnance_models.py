# apps/consultations/models/ligne_ordonnance_models.py
from django.db import models
from django.db.models import Max


class LigneOrdonnance(models.Model):
    STATUT_EN_ATTENTE = 'EN_ATTENTE'
    STATUT_DONNEE     = 'DONNEE'
    STATUT_PHARMACIE  = 'PHARMACIE'
    STATUT_IGNORE     = 'IGNORE'       # ← nouveau : ligne traitée sans stock

    STATUT_CHOICES = (
        (STATUT_EN_ATTENTE, 'En attente'),
        (STATUT_DONNEE,     'Donnée'),
        (STATUT_PHARMACIE,  'Pharmacie'),
        (STATUT_IGNORE,     'Ignorée'),
    )

    ordonnance = models.ForeignKey(
        'consultations.Ordonnance',
        on_delete=models.CASCADE,
        related_name='lignes_ordonnance',
    )
    texte = models.CharField(max_length=255)
    medicament = models.ForeignKey(
        'stock.Medicament',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lignes_ordonnance',
    )
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default=STATUT_EN_ATTENTE,
    )
    ordre = models.PositiveIntegerField(editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['ordre', 'created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['ordonnance', 'ordre'],
                name='unique_ligne_ordonnance_order',
            )
        ]

    def save(self, *args, **kwargs):
        if self.ordre is None and self.ordonnance_id is not None:
            max_ordre = (
                LigneOrdonnance.objects.filter(ordonnance_id=self.ordonnance_id)
                .aggregate(max_ordre=Max('ordre'))
                .get('max_ordre')
            )
            self.ordre = (max_ordre or 0) + 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Ligne {self.ordre} - {self.statut}"