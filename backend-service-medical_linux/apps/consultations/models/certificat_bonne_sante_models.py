from django.db import models

from .consultation_models import Consultation


class CertificatBonneSante(models.Model):
    consultation = models.ForeignKey(
        Consultation,
        on_delete=models.PROTECT,
        related_name="certificats_bonne_sante",
        null=True,
        blank=True,
    )

    nom_prenom_enfant = models.CharField(max_length=200)
    date_naissance = models.DateField()
    nom_prenom_medecin = models.CharField(max_length=200, blank=True)

    date_emission = models.DateField(auto_now_add=True)

    class Meta:
        ordering = ["-date_emission"]

    def save(self, *args, **kwargs):
        if self.consultation_id and not self.nom_prenom_medecin:
            medecin = self.consultation.medecin
            first = medecin.profile.user.first_name or ""
            last = medecin.profile.user.last_name or ""
            if first or last:
                self.nom_prenom_medecin = f"{first} {last}".strip()
            else:
                self.nom_prenom_medecin = medecin.profile.user.username
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Certificat Bonne Sante {self.nom_prenom_enfant} - {self.date_emission}"
