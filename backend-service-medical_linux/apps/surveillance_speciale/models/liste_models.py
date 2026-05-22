from django.db import models
from django.db.models import Max
from django.utils import timezone

from apps.account.models import Medecin, Profile, Site
from apps.employees.models import Collaborateur


class ListeSurveillanceSpeciale(models.Model):
    """
    Liste « SMS » — surveillance médicale spéciale (flux type contre-visite, sans import).
    Référence auto : SMS-AAAA-NNN.
    """

    STATUT_BROUILLON = "BROUILLON"
    STATUT_SOUMISE = "SOUMISE"
    STATUT_EN_TRAITEMENT = "EN_TRAITEMENT"
    STATUT_CLOTUREE = "CLOTUREE"
    STATUT_ARCHIVEE = "ARCHIVEE"

    STATUT_CHOICES = [
        (STATUT_BROUILLON, "Brouillon"),
        (STATUT_SOUMISE, "Soumise"),
        (STATUT_EN_TRAITEMENT, "En traitement"),
        (STATUT_CLOTUREE, "Clôturée"),
        (STATUT_ARCHIVEE, "Archivée"),
    ]

    reference = models.CharField(max_length=20, unique=True, editable=False)
    date_visite = models.DateField(null=True, blank=True)
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default=STATUT_BROUILLON,
    )
    titre = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="Intitulé",
        help_text="Libellé libre (ex. campagne, motif).",
    )
    medecin = models.ForeignKey(
        Medecin,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="listes_surveillance_speciale_assignees",
        verbose_name="Médecin du travail",
    )
    cree_par = models.ForeignKey(
        Profile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="listes_surveillance_speciale_creees",
    )
    site = models.ForeignKey(
        Site,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="listes_surveillance_speciale",
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    sms_veille_envoye = models.BooleanField(
        default=False,
        verbose_name="SMS rappel veille (J-1) envoyé",
    )

    class Meta:
        ordering = ["-date_creation"]
        db_table = "listes_surveillance_speciale"
        verbose_name = "Liste surveillance médicale spéciale"
        verbose_name_plural = "Listes surveillance médicale spéciale"

    def __str__(self):
        return f"{self.reference} - {self.date_visite}"

    def save(self, *args, **kwargs):
        if not self.reference:
            year = self.date_visite.year if self.date_visite else timezone.localdate().year
            prefix = f"SMS-{year}-"
            last = (
                ListeSurveillanceSpeciale.objects.filter(reference__startswith=prefix)
                .order_by("-reference")
                .first()
            )
            next_num = 1
            if last and last.reference:
                try:
                    next_num = int(last.reference.split("-")[-1]) + 1
                except (ValueError, IndexError):
                    next_num = 1
            self.reference = f"{prefix}{next_num:03d}"
        super().save(*args, **kwargs)


class LigneSurveillanceSpeciale(models.Model):
    PRESENCE_EN_ATTENTE = "EN_ATTENTE"
    PRESENCE_PRESENT = "PRESENT"
    PRESENCE_ABSENT = "ABSENT"
    PRESENCE_REPORTE = "REPORTE"

    PRESENCE_CHOICES = [
        (PRESENCE_EN_ATTENTE, "En attente"),
        (PRESENCE_PRESENT, "Présent"),
        (PRESENCE_ABSENT, "Absent"),
        (PRESENCE_REPORTE, "Reporté"),
    ]

    liste = models.ForeignKey(
        ListeSurveillanceSpeciale,
        on_delete=models.CASCADE,
        related_name="lignes",
    )
    collaborateur = models.ForeignKey(
        Collaborateur,
        on_delete=models.CASCADE,
        related_name="lignes_surveillance_speciale",
    )
    ordre = models.PositiveIntegerField(
        verbose_name="Ordre dans la liste",
        help_text="Rang pour la file d'attente (SMS). Unique par liste.",
    )
    presence = models.CharField(
        max_length=20,
        choices=PRESENCE_CHOICES,
        default=PRESENCE_EN_ATTENTE,
    )
    raison_report = models.TextField(blank=True)
    traitement_termine = models.BooleanField(default=False)
    remarque_medecin = models.TextField(blank=True)
    sms_jour_j_envoye = models.BooleanField(
        default=False,
        verbose_name="SMS jour J (file) envoyé",
    )

    class Meta:
        ordering = ["ordre", "pk"]
        db_table = "lignes_surveillance_speciale"
        verbose_name = "Ligne surveillance médicale spéciale"
        verbose_name_plural = "Lignes surveillance médicale spéciale"
        constraints = [
            models.UniqueConstraint(
                fields=["liste", "ordre"],
                name="uniq_ligne_ss_ordre_par_liste",
            ),
            models.UniqueConstraint(
                fields=["liste", "collaborateur"],
                name="uniq_ligne_ss_collaborateur_par_liste",
            ),
        ]

    def __str__(self):
        return f"{self.liste.reference} - {self.collaborateur_id}"

    @classmethod
    def prochain_ordre_pour_liste(cls, liste):
        last = cls.objects.filter(liste=liste).aggregate(m=Max("ordre")).get("m")
        return (last + 1) if last else 1

    def save(self, *args, **kwargs):
        if self.liste_id and not self.ordre:
            self.ordre = LigneSurveillanceSpeciale.prochain_ordre_pour_liste(self.liste)
        super().save(*args, **kwargs)


def renumeroter_lignes_liste_apres_suppression(liste_id):
    lignes = list(
        LigneSurveillanceSpeciale.objects.filter(liste_id=liste_id).order_by("ordre", "pk")
    )
    for i, ligne in enumerate(lignes, start=1):
        if ligne.ordre != i:
            ligne.ordre = i
            ligne.save(update_fields=["ordre"])
