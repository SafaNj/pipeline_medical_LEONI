from django.db import models
from .fiche_aptitude_models import FicheAptitude


class CertificatAptitude(models.Model):
    """Certificat d'aptitude."""
    
    fiche_aptitude = models.OneToOneField(
        FicheAptitude,
        on_delete=models.CASCADE,
        related_name='certificat',
        verbose_name="Fiche d'Aptitude"
    )
    
    date_emission = models.DateField(verbose_name="Date d'émission")

    description = models.TextField(verbose_name="Description")
    
    class Meta:
        db_table = 'certificats_aptitude'
        verbose_name = "Certificat d'Aptitude"
        verbose_name_plural = "Certificats d'Aptitude"
        ordering = ['-date_emission']
    
    def __str__(self):
        return f"Certificat {self.fiche_aptitude_id}"