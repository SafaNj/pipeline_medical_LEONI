from django.db import models
from django.core.exceptions import ValidationError
from .profil_models import Profile, MedType  



class Medecin(models.Model):
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE)
    med_type = models.ForeignKey(MedType, on_delete=models.SET_NULL, null=True)
    nom_ar = models.CharField(max_length=200, blank=True)
    prenom_ar = models.CharField(max_length=200, blank=True)
    specialite = models.CharField(max_length=100)
    numero_ordre = models.CharField(max_length=100)
    lieu_exercice_medecin = models.CharField(max_length=200, blank=True)
    adresse_numero_rue = models.CharField(max_length=255, blank=True)
    ville_cabinet = models.CharField(max_length=150, blank=True)
    gouvernorat_cabinet = models.CharField(max_length=150, blank=True)
    grade = models.CharField(max_length=100, null=True, blank=True)
    heures_par_defaut = models.PositiveIntegerField(default=2)
    site = models.ForeignKey(
        'account.Site',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='medecins',
    )

    def clean(self):
        super().clean()
        med_type_name = (self.med_type.name if self.med_type else '').strip().lower()
        if med_type_name == 'médecin du travail' and self.site is None:
            raise ValidationError({
                'site': "Le site est obligatoire pour un Médecin du Travail."
            })

    def __str__(self):
        return self.profile.user.username

