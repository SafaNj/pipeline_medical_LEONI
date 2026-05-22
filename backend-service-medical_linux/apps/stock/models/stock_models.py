from django.db import models


class StockMedicament(models.Model):
    site = models.ForeignKey(
        'account.Site',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='stocks_medicaments',
    )
    medicament = models.ForeignKey(
        'stock.Medicament',
        on_delete=models.CASCADE,
        related_name='stocks',
    )
    quantite = models.PositiveIntegerField(default=0)
    seuil_alerte = models.PositiveIntegerField(default=10)
    date_expiration = models.DateField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['site', 'medicament'], name='unique_stock_per_site_medicament')
        ]
        ordering = ['medicament__nom']

    def __str__(self):
        return f"Stock {self.medicament} - {self.quantite}"
