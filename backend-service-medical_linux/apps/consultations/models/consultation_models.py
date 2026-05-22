from django.db import models


class Consultation(models.Model):
    item_passage = models.OneToOneField(
        'planning.ItemPassage',
        on_delete=models.PROTECT,
        null=False,
        blank=False,
        related_name='consultation',
    )

    medecin = models.ForeignKey(
        'account.Medecin',
        on_delete=models.PROTECT,
        related_name='consultations_effectuees',
    )

    site = models.ForeignKey(
        'account.Site',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='consultations',
    )

    date_consultation = models.DateTimeField(auto_now_add=True)
    diagnostic = models.TextField()
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_consultation']

    @property
    def collaborateur(self):
        if self.item_passage:
            return self.item_passage.collaborateur
        return None

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.item_passage_id:
            item = self.item_passage
            item.statut = 'EFFECTUEE'
            item.save(update_fields=['statut'])
            
    def __str__(self):
        collab = self.item_passage.collaborateur
        if collab:
            try:
                full_name = f"{collab.nom} {collab.prenom}".strip()
            except Exception:
                full_name = ""

            label = full_name or (collab.matricule or f"#{self.item_passage_id}")
            return f"Consultation {label} - {self.date_consultation.strftime('%d/%m/%Y')}"
        return f"Consultation #{self.pk}"