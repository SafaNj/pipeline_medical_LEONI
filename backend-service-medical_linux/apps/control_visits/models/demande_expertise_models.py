from django.db import models
from django.utils import timezone

from apps.account.models import Medecin

from .contre_visite_models import ContreVisite


class DemandeExpertise(models.Model):
    contre_visite = models.ForeignKey(
        ContreVisite,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='demandes_expertise',
        verbose_name='Contre-visite',
    )
    medecin_controleur = models.ForeignKey(
        Medecin,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        editable=False,
        related_name='demandes_expertise',
        verbose_name='Medecin controleur',
    )
    date_creation = models.DateTimeField(auto_now_add=True, verbose_name='Date de creation')
    dr = models.TextField(verbose_name='Docteur destinataire')
    date_demande = models.DateField(default=timezone.localdate, verbose_name='Date de demande')
    collaborateur_nom = models.CharField(max_length=255, verbose_name='Nom')
    collaborateur_prenom = models.CharField(max_length=255, verbose_name='Prenom')
    collaborateur_matricule = models.CharField(max_length=50, verbose_name='Matricule')
    pieces_jointes = models.TextField(blank=True, verbose_name='Pieces jointes')
    poste = models.CharField(max_length=255, blank=True, verbose_name='Poste')
    autres_missions = models.TextField(blank=True, verbose_name='Autres missions')

    class Meta:
        ordering = ['-date_demande']
        verbose_name = 'Demande d expertise'
        verbose_name_plural = 'Demandes d expertise'

    def __str__(self):
        return f"{self.collaborateur_nom} {self.collaborateur_prenom} - {self.date_demande}"

    def save(self, *args, **kwargs):
        if self.contre_visite_id:
            full_name = (self.contre_visite.nom_prenom or '').strip()
            parts = full_name.split()
            if parts:
                if not self.collaborateur_nom:
                    self.collaborateur_nom = parts[0]
                if len(parts) > 1 and not self.collaborateur_prenom:
                    self.collaborateur_prenom = ' '.join(parts[1:])
            if not self.collaborateur_matricule:
                self.collaborateur_matricule = self.contre_visite.matricule

        super().save(*args, **kwargs)
