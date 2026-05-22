from django.db import models
from django.utils import timezone


class ListePassage(models.Model):
    SESSION_MORNING = 'MATIN'
    SESSION_MIDI = 'MIDI'
    SESSION_AFTERNOON = 'APRES_MIDI'
    SESSION_CHOICES = [
        (SESSION_MORNING, 'Matin'),
        (SESSION_MIDI, 'Midi'),
        (SESSION_AFTERNOON, 'Après-midi'),
    ]

    TYPE_CONSULTATION = 'CONSULTATION'
    TYPE_CONTRE_VISITE = 'CONTRE_VISITE'
    TYPE_CHOICES = [
        (TYPE_CONSULTATION, 'Consultation'),
        (TYPE_CONTRE_VISITE, 'Contre visite'),
    ]

    STATUS_PREP = 'EN_PREPARATION'
    STATUS_ACTIVE = 'ACTIVE'
    STATUS_DONE = 'TERMINEE'
    STATUS_CHOICES = [
        (STATUS_PREP, 'En préparation'),
        (STATUS_ACTIVE, 'Active'),
        (STATUS_DONE, 'Terminée'),
    ]

    date = models.DateField(default=timezone.localdate)
    session = models.CharField(max_length=20, choices=SESSION_CHOICES)
    medecin = models.ForeignKey('account.Medecin', on_delete=models.SET_NULL, null=True, blank=True)
    type_liste = models.CharField(max_length=30, choices=TYPE_CHOICES)
    statut = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PREP)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Liste de passage'
        verbose_name_plural = 'Listes de passage'
        ordering = ['-date', 'session']
        
        # ✨ AJOUTER CETTE LIGNE ✨
        unique_together = [['date', 'session', 'medecin', 'type_liste']]

    def __str__(self):
        return f"{self.get_type_liste_display()} - {self.date} - {self.session}"