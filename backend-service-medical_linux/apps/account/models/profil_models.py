# account/models/profil_models.py
from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    ROLE_CHOICES = (
        ('medecin', 'Médecin'),
        ('infirmier', 'Infirmier'),
        ('rh', 'RH'),
        ('hsse', 'HSSE'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES)
    phone = models.CharField(max_length=20, null=True, blank=True)
    must_change_password = models.BooleanField(default=True, help_text="L'utilisateur doit changer son mot de passe à la première connexion")


    def __str__(self):
        return self.user.username


class MedType(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name