from django.db import models

from apps.account.models import Medecin
from apps.employees.models import Collaborateur


class FicheSurveillanceSpecialeMateur(models.Model):
    """
    Fiche SMS (Surveillance médicale spéciale) spécifique au site template MATEUR.

    Liée 1-1 à une FicheAptitude (type_visite = SURVEILLANCE_SPECIALE).
    """

    fiche_aptitude = models.OneToOneField(
        "medical_work.FicheAptitude",
        on_delete=models.CASCADE,
        related_name="sms_mateur",
        verbose_name="Fiche d'aptitude (parent)",
    )

    # Relations demandées (lecture directe en DB)
    collaborateur = models.ForeignKey(
        Collaborateur,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sms_mateur_fiches",
        verbose_name="Collaborateur",
    )
    medecin_travail = models.ForeignKey(
        Medecin,
        on_delete=models.PROTECT,
        related_name="sms_mateur_fiches",
        verbose_name="Médecin du travail",
    )

    # 2 — Motifs
    motif_moins_18 = models.BooleanField(default=False)
    motif_enceinte_allaitante = models.BooleanField(default=False)
    motif_handicape = models.BooleanField(default=False)
    motif_travaux_risques_accidents = models.BooleanField(default=False)
    motif_maladie_chronique = models.BooleanField(default=False)
    motif_travaux_maladies_professionnelles = models.BooleanField(default=False)

    # 3 — Poste / tâche
    poste_caracteristiques = models.TextField(blank=True, default="")
    poste_ergonomie = models.TextField(blank=True, default="")
    tache_habituelle = models.TextField(blank=True, default="")

    # 4 — Risques
    risques_accidents = models.TextField(blank=True, default="")
    tableaux_mp_et_agents = models.TextField(blank=True, default="")
    evaluation_exposition = models.TextField(blank=True, default="")

    # 5 — Tableau (8 lignes) : liste de dicts {date_examen, nature_examen, resultats, medecin_signature}
    surveillance_rows = models.JSONField(default=list, blank=True)

    # 6 — Prévention
    mesures_prevention = models.TextField(blank=True, default="")

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "fiches_surveillance_speciale_mateur"
        verbose_name = "Fiche SMS (Mateur)"
        verbose_name_plural = "Fiches SMS (Mateur)"
        ordering = ["-date_creation"]

    def __str__(self):
        return f"SMS Mateur fiche#{self.fiche_aptitude_id}"

