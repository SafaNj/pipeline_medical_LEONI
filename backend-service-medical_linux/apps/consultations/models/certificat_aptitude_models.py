from django.db import models
from datetime import date

from apps.embauche.im_sync import get_data_from_im

from .consultation_models import Consultation


class CertificatAptitudeGenerale(models.Model):
    consultation = models.ForeignKey(
        Consultation,
        on_delete=models.CASCADE,
        related_name="certificats_aptitude_generale",
    )

    nom_prenom_patient = models.CharField(max_length=200)
    date_naissance = models.DateField()
    nom_prenom_medecin = models.CharField(max_length=200, blank=True)

    est_bonne_sante = models.BooleanField(
        default=False,
        verbose_name="En bonne santé clinique",
    )
    indemne_pathologie_contagieuse = models.BooleanField(
        default=False,
        verbose_name="Qu’il Est Indemne De Toute Pathologie Contagieuse",
    )
    apte_sport = models.BooleanField(
        default=False,
        verbose_name="Apte Pour Pratiquer Le Sport",
    )
    apte_collectivite = models.BooleanField(
        default=False,
        verbose_name="Apte à être en collectivité",
    )

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
                    self.nom_prenom_patient = full_name or (collab.matricule or "").strip()
                except Exception:
                    self.nom_prenom_patient = (collab.matricule or "").strip()
                if collab.date_naissance:
                    self.date_naissance = collab.date_naissance
                elif collab.matricule:
                    im_data = get_data_from_im(collab.matricule) or {}
                    raw_date = im_data.get("date_naissance")
                    if raw_date:
                        try:
                            self.date_naissance = date.fromisoformat(str(raw_date))
                        except Exception:
                            pass
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Certificat Aptitude {self.nom_prenom_patient} - {self.date_emission}"
