# account/models/infirmier_models.py
from django.db import models
from .profil_models import Profile

class Infirmier(models.Model):
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE)
    service = models.CharField(max_length=100)
    shift = models.CharField(max_length=50)
    site = models.ForeignKey(
        'account.Site',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='infirmiers',
    )

    def __str__(self):
        return self.profile.user.username