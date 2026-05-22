from datetime import date

from django.db import models

from .consultation_models import Consultation


class Ordonnance(models.Model):
    consultation = models.ForeignKey(
        Consultation,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='ordonnances',
    )

    date_emission = models.DateField(default=date.today)

    class Meta:
        ordering = ['-date_emission']

    def __str__(self):
        if self.consultation is not None:
            return f"Ordonnance - {self.consultation} - {self.date_emission}"
        return f"Ordonnance sans consultation - {self.date_emission}"