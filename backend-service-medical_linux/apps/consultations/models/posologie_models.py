"""
PosologieStandard — posologies de référence configurables via l'admin Django.
Utilisées comme fallback quand le médecin n'a pas d'historique.
"""
from django.db import models


class PosologieStandard(models.Model):
    texte  = models.CharField(
        max_length=255,
        unique=True,
        verbose_name="Texte de posologie",
        help_text="Ex: 3 fois par jour — matin, midi et soir — pendant 7 jours",
    )
    ordre  = models.PositiveIntegerField(
        default=0,
        verbose_name="Ordre d'affichage",
        help_text="Les posologies avec le plus petit numéro apparaissent en premier",
    )
    actif  = models.BooleanField(
        default=True,
        verbose_name="Active",
        help_text="Décocher pour masquer sans supprimer",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['ordre', 'texte']
        verbose_name = "Posologie standard"
        verbose_name_plural = "Posologies standard"

    def __str__(self):
        return self.texte