from django.db import models
from .profil_models import Profile

class HSEE(models.Model):
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE)
    zone = models.CharField(max_length=100)
    certification = models.CharField(max_length=100)
    site = models.ForeignKey(
        'account.Site',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='hsees',
    )

    def __str__(self):
        return self.profile.user.username