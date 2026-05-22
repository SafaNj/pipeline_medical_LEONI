from django.conf import settings
from django.db import models


class MouvementStock(models.Model):
    ENTREE = 'ENTREE'
    SORTIE = 'SORTIE'

    TYPE_CHOICES = (
        (ENTREE, 'Entree'),
        (SORTIE, 'Sortie'),
    )

    stock = models.ForeignKey(
        'stock.StockMedicament',
        on_delete=models.PROTECT,
        related_name='mouvements',
    )
    type_mouvement = models.CharField(max_length=10, choices=TYPE_CHOICES)
    quantite = models.PositiveIntegerField()
    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='mouvements_stock',
    )
    collaborateur = models.ForeignKey(
        'employees.Collaborateur',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mouvements_stock',
        verbose_name='Collaborateur bénéficiaire',
        help_text='Rempli si la sortie est nominative (dispensation à un collaborateur)',
    )
    motif = models.TextField(null=True, blank=True)
    acte = models.ForeignKey(
        'stock.ActeInfirmier',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mouvements_stock',
    )
    date_mouvement = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_mouvement']

    def __str__(self):
        who = f' → {self.collaborateur}' if self.collaborateur else ''
        return f"{self.type_mouvement} - {self.stock.medicament} - {self.quantite}{who}"