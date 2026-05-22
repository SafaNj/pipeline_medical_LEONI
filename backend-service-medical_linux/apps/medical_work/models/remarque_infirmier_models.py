from django.db import models
from apps.medical_work.models.fiche_aptitude_models import FicheAptitude
from apps.account.models import Profile


class RemarqueInfirmier(models.Model):
    """
    Notes saisies par l'infirmier sur une fiche d'aptitude.
    Table séparée de FicheAptitude pour respecter la séparation des rôles.
    """
    fiche_aptitude = models.OneToOneField(
        FicheAptitude,
        on_delete=models.CASCADE,
        related_name='remarque_infirmier',
        verbose_name="Fiche d'aptitude",
    )
    infirmier = models.ForeignKey(
        Profile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='remarques_infirmier',
        verbose_name="Infirmier",
    )
    remarque = models.TextField(
        blank=True,
        verbose_name="Remarque infirmier",
    )
    reevaluation = models.TextField(
        blank=True,
        verbose_name="Ré-évaluation infirmier",
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'remarques_infirmier'
        verbose_name = "Remarque infirmier"
        verbose_name_plural = "Remarques infirmier"

    def __str__(self):
        return f"Remarque infirmier - Fiche {self.fiche_aptitude_id}"
