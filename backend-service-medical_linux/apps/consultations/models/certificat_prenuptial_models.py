from django.db import models
from datetime import date

from apps.embauche.im_sync import get_data_from_im

from .consultation_models import Consultation


class CertificatPrenuptial(models.Model):
    consultation = models.ForeignKey(
        Consultation,
        on_delete=models.CASCADE,
        related_name="certificats_prenuptiaux",
        verbose_name="Consultation",
    )

    nom_prenom = models.CharField(max_length=200, verbose_name="Nom et prenom")
    nom_prenom_medecin = models.CharField(max_length=200, blank=True, verbose_name="Nom et prenom medecin")
    date_naissance = models.DateField(verbose_name="Date de naissance")
    lieu_naissance = models.CharField(max_length=200, verbose_name="Lieu de naissance")
    cin = models.CharField(max_length=50, verbose_name="CIN")
    cin_delivree_a = models.CharField(max_length=200, blank=True, verbose_name="CIN delivree a")
    cin_date = models.DateField(null=True, blank=True, verbose_name="Date delivrance CIN")
    adresse_patient = models.CharField(max_length=255, blank=True, verbose_name="Adresse patient")
    adresse_medecin = models.CharField(max_length=255, blank=True, verbose_name="Numero Adresse medecin")
    ville_medecin = models.CharField(max_length=150, blank=True, verbose_name="rue")
    gouvernorat_medecin = models.CharField(max_length=150, blank=True, verbose_name="Gouvernorat medecin")
    numero_ordre_medecin = models.CharField(max_length=100, blank=True, verbose_name="Numero ordre medecin")
    specialite_medecin = models.CharField(max_length=150, blank=True, verbose_name="Specialite medecin")
    lieu_exercice_medecin = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="exerçant à",
    )
    lieu_signature = models.CharField(max_length=200, blank=True, verbose_name="Lieu signature")

    groupe_sanguin_fait = models.BooleanField(default=False, verbose_name="Groupe sanguin")
    hepatite_b_fait = models.BooleanField(default=False, verbose_name="Hepatite Virale B")
    hepatite_c_fait = models.BooleanField(default=False, verbose_name="Hepatite Virale C")
    radio_thorax_fait = models.BooleanField(
        default=False,
        verbose_name="Radiographie du Thorax par Rayon X",
    )

    autres_examens = models.TextField(blank=True, verbose_name="Autres examens")

    date_emission = models.DateField(auto_now_add=True, verbose_name="Date emission")

    class Meta:
        ordering = ["-date_emission"]

    def save(self, *args, **kwargs):
        if self.consultation_id:
            consultation = self.consultation
            medecin = getattr(consultation, "medecin", None)
            if medecin and not self.nom_prenom_medecin:
                first = medecin.profile.user.first_name or ""
                last = medecin.profile.user.last_name or ""
                if first or last:
                    self.nom_prenom_medecin = f"{first} {last}".strip()
                else:
                    self.nom_prenom_medecin = medecin.profile.user.username

            collab = getattr(consultation, "collaborateur", None)
            if collab:
                try:
                    full_name = f"{collab.nom} {collab.prenom}".strip()
                    self.nom_prenom = full_name or (collab.matricule or "").strip()
                except Exception:
                    self.nom_prenom = (collab.matricule or "").strip()
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
                self.lieu_naissance = collab.lieu_naissance or self.lieu_naissance
                self.cin = collab.cin or self.cin
                self.adresse_patient = collab.adresse or self.adresse_patient
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Certificat Prenuptial {self.nom_prenom} - {self.date_emission}"
