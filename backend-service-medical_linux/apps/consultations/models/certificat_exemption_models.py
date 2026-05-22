from django.db import models

from .consultation_models import Consultation


class CertificatExemption(models.Model):
    consultation = models.ForeignKey(
        Consultation,
        on_delete=models.CASCADE,
        related_name="certificats_exemption",
    )

    nom_patient = models.CharField(max_length=200)
    nom_prenom_medecin = models.CharField(max_length=200, blank=True)
    duree_exemption = models.CharField(max_length=100)
    date_emission = models.DateField(auto_now_add=True)

    class Meta:
        ordering = ["-date_emission"]

    def save(self, *args, **kwargs):
        if self.consultation_id:
            medecin = self.consultation.medecin
            if not self.nom_prenom_medecin:
                first = medecin.profile.user.first_name or ""
                last = medecin.profile.user.last_name or ""
                if first or last:
                    self.nom_prenom_medecin = f"{first} {last}".strip()
                else:
                    self.nom_prenom_medecin = medecin.profile.user.username

            collab = self.consultation.collaborateur
            if collab:
                try:
                    full_name = f"{collab.nom} {collab.prenom}".strip()
                    self.nom_patient = full_name or (collab.matricule or "").strip()
                except Exception:
                    self.nom_patient = (collab.matricule or "").strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Certificat Exemption {self.nom_patient} - {self.date_emission}"
