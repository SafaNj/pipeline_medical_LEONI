from django.db import models
from .fiche_aptitude_models import FicheAptitude


class DemandeBilan(models.Model):
    ANTICOAGULANTS_CHOICES = [
        ("", ""),
        ("OUI", "Oui"),
        ("NON", "Non"),
    ]

    fiche_aptitude = models.ForeignKey(
        FicheAptitude,
        on_delete=models.CASCADE,
        related_name='demandes_bilan',
        verbose_name="Fiche d'Aptitude",
        null=True,
        blank=True,
    )

    numero_labo = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="N° Laboratoire"
    )

    cin = models.CharField(
        max_length=50,
        blank=True,
        editable=False,
        verbose_name="CIN"
    )

    date_demande = models.DateField(
        verbose_name="Date de demande"
    )

    # Cases à cocher — Examens de laboratoire
    glycemie = models.BooleanField(
        default=False, verbose_name="Glycémie"
    )
    creatinine = models.BooleanField(
        default=False, verbose_name="Créatinine"
    )
    nfs = models.BooleanField(
        default=False, verbose_name="NFS"
    )
    vs = models.BooleanField(
        default=False, verbose_name="VS"
    )
    transaminases = models.BooleanField(
        default=False, verbose_name="Transaminases"
    )
    acide_urique = models.BooleanField(
        default=False, verbose_name="Acide urique"
    )
    triglycerides = models.BooleanField(
        default=False, verbose_name="Triglycérides"
    )
    cholesterol = models.BooleanField(
        default=False, verbose_name="Cholestérol"
    )
    copro_parasitologique = models.BooleanField(
        default=False, verbose_name="Copro parasitologique"
    )

    # Champs spécifiques formulaire FOR-AMT-07 (Sousse)
    hta = models.BooleanField(default=False, blank=True, verbose_name="HTA")
    anemie = models.BooleanField(default=False, blank=True, verbose_name="Anémie")
    hepatite = models.BooleanField(default=False, blank=True, verbose_name="Hépatite")
    autre_atcd = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Autres ATCD",
    )
    diabete = models.BooleanField(default=False, blank=True, verbose_name="Diabète")
    dyslipidemie = models.BooleanField(default=False, blank=True, verbose_name="Dyslipidémie")
    goutte = models.BooleanField(default=False, blank=True, verbose_name="Goutte")

    anticoagulants = models.CharField(
        max_length=3,
        choices=ANTICOAGULANTS_CHOICES,
        blank=True,
        default="",
        verbose_name="Anticoagulants",
    )

    chimique = models.BooleanField(default=False, blank=True, verbose_name="Risque chimique")
    infectieux = models.BooleanField(default=False, blank=True, verbose_name="Risque infectieux")
    chauffeur = models.BooleanField(default=False, blank=True, verbose_name="Risque chauffeur")
    travail_poste_nuit = models.BooleanField(
        default=False,
        blank=True,
        verbose_name="Travail de nuit / poste",
    )
    autres_risques = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Autres risques",
    )

    depistage = models.BooleanField(default=False, blank=True, verbose_name="Dépistage")
    suivi_pathologies_chroniques = models.BooleanField(
        default=False,
        blank=True,
        verbose_name="Suivi pathologies chroniques",
    )

    ldl_hdl_cholesterol = models.BooleanField(
        default=False,
        blank=True,
        verbose_name="LDL / HDL / Cholestérol",
    )

    renseignements_cliniques = models.TextField(
        blank=True,
        default="",
        verbose_name="Renseignements cliniques",
    )

    class Meta:
        db_table = 'demandes_bilan'
        verbose_name = "Demande de Bilan"
        verbose_name_plural = "Demandes de Bilan"
        ordering = ['-date_demande']

    def save(self, *args, **kwargs):
        if self.fiche_aptitude_id and self.fiche_aptitude.collaborateur_id:
            try:
                self.cin = self.fiche_aptitude.collaborateur.cin or ""
            except Exception:
                self.cin = ""
        else:
            self.cin = ""
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Bilan {self.fiche_aptitude_id} - {self.date_demande}"