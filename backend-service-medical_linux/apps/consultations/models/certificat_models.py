from django.db import models

from .consultation_models import Consultation


class CertificatMedical(models.Model):
    consultation = models.ForeignKey(
        Consultation,
        on_delete=models.CASCADE,
        related_name='certificats',
    )

    date_emission = models.DateField(auto_now_add=True)

    nom_prenom_medecin = models.CharField(max_length=200, blank=True)
    nom_prenom_collab = models.CharField(max_length=200, blank=True)

    jours_repos = models.PositiveIntegerField()
    date_debut_repos = models.DateField()

    class Meta:
        ordering = ['-date_emission']

    def save(self, *args, **kwargs):
        if self.consultation_id:
            medecin = self.consultation.medecin
            collab = self.consultation.collaborateur

            if not self.nom_prenom_medecin:
                first = medecin.profile.user.first_name or ''
                last = medecin.profile.user.last_name or ''
                if first or last:
                    self.nom_prenom_medecin = f"{first} {last}".strip()
                else:
                    self.nom_prenom_medecin = medecin.profile.user.username

            if not self.nom_prenom_collab:
                try:
                    full_name = f"{collab.nom} {collab.prenom}".strip()
                    self.nom_prenom_collab = full_name or (collab.matricule or "").strip()
                except Exception:
                    self.nom_prenom_collab = (collab.matricule or "").strip()

        super().save(*args, **kwargs)

    def __str__(self):
     return f"Certificat {self.nom_prenom_collab} — {self.date_emission}"