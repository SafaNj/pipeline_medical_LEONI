from django.db import models
from .profil_models import Profile

class RH(models.Model):
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE)
    departement = models.CharField(max_length=100)
    site = models.ForeignKey(
        'account.Site',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rhs',
    )

    def __str__(self):
        return self.profile.user.username