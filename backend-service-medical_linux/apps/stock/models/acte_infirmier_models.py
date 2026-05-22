from django.conf import settings
from django.db import models


class ActeInfirmier(models.Model):

    TYPE_DON       = 'DON'
    TYPE_OUVERTURE = 'OUVERTURE'
    TYPE_CHOICES   = [
        (TYPE_DON,       'Don à un employé'),
        (TYPE_OUVERTURE, 'Ouverture de boîte'),
    ]

    type_acte = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default=TYPE_OUVERTURE,
    )

    collaborateur = models.ForeignKey(
        'employees.Collaborateur',
        on_delete=models.PROTECT,
        related_name='actes_infirmiers',
        null=True,   
        blank=True,   
    )
    medicament = models.ForeignKey(
        'stock.Medicament',
        on_delete=models.PROTECT,
        related_name='actes_infirmiers',
    )
    quantite = models.PositiveIntegerField()
    motif = models.TextField(null=True, blank=True)
    ligne_ordonnance = models.ForeignKey(
        'consultations.LigneOrdonnance',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='actes_infirmiers',
    )
    infirmiere = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='actes_infirmiers_realises',
    )
    date_acte = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_acte']

    def __str__(self):
        return f"Acte {self.type_acte} - {self.medicament} ({self.quantite})"