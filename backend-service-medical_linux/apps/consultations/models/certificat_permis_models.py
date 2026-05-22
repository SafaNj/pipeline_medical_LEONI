from django.db import models
from datetime import date

from apps.embauche.im_sync import get_data_from_im

from .consultation_models import Consultation


class CertificatPermisConduire(models.Model):
    GROUPE_PERMIS_CHOICES = (
        ("groupe_1", "Groupe 1"),
        ("groupe_2", "Groupe 2"),
        ("les_deux", "Les deux"),
    )

    consultation = models.ForeignKey(
        Consultation,
        on_delete=models.CASCADE,
        related_name="certificats_permis",
    )

    nom_prenom = models.CharField(max_length=200)
    nom_prenom_medecin = models.CharField(max_length=200, blank=True)
    date_naissance = models.DateField()
    lieu_naissance = models.CharField(max_length=200)
    adresse_residence = models.CharField(max_length=255, blank=True)
    cin = models.CharField(max_length=50)
    cin_delivree_a = models.CharField(max_length=200, blank=True)
    cin_date = models.DateField(null=True, blank=True)
    numero_ordre_medecin = models.CharField(max_length=100, blank=True)
    lieu_exercice_medecin = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="exerçant à",
    )

    groupe_permis = models.CharField(max_length=20, choices=GROUPE_PERMIS_CHOICES)
    sous_paragraphe = models.CharField(max_length=100, blank=True)
    paragraphe = models.CharField(max_length=100, blank=True)
    classe = models.CharField(max_length=100, blank=True)

    examine_par_specialiste = models.BooleanField(
        default=False,
        verbose_name="examiné par un spécialiste en",
    )
    examine_par_specialiste_type = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="Type de spécialiste (examen)",
    )
    certificat_delivre_par_specialiste = models.BooleanField(
        default=False,
        verbose_name="certificat délivré par un spécialiste en",
    )
    certificat_delivre_par_specialiste_type = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="Type de spécialiste (certificat)",
    )
    inapte_conduite = models.BooleanField(
        default=False,
        verbose_name="est inapte à la conduite des véhicules",
    )
    inapte_conduite_raison = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="Raison de l'inaptitude",
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
                self.adresse_residence = collab.adresse or self.adresse_residence
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Certificat Permis {self.nom_prenom} - {self.date_emission}"
