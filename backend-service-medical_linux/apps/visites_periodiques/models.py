from django.db import IntegrityError, models, transaction
from django.utils import timezone

from apps.account.models import Profile


class ListeVisitePeriodique(models.Model):
    """Liste de visite périodique (flux type embauche, référence VP-…)."""

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
    medecin = models.ForeignKey(
        "account.Medecin",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="listes_visite_periodique_assignees",
    )
    cree_par = models.ForeignKey(
        Profile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="listes_visite_periodique_creees",
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    sms_veille_envoye = models.BooleanField(
        default=False,
        verbose_name="SMS rappel veille (J-1) envoyé",
    )

    class Meta:
        ordering = ["-date_creation"]
        db_table = "listes_visite_periodique"
        verbose_name = "Liste visite périodique"
        verbose_name_plural = "Listes visites périodiques"

    def __str__(self):
        return f"{self.reference} — {self.date_visite}"

    @classmethod
    def _next_vp_reference_for_year(cls, year: int) -> str:
        """
        Prochaine référence VP-{year}-NNN en fonction du **plus grand suffixe numérique**
        existant pour ce préfixe.

        L'ancien code utilisait ``order_by('-reference')`` : l'ordre lexicographique
        n'est pas l'ordre numérique (ex. ``VP-2026-099`` > ``VP-2026-100``), ce qui
        pouvait régénérer un numéro déjà pris et lever une IntegrityError sur ``unique``.
        """
        prefix = f"VP-{year}-"
        refs = cls.objects.filter(reference__startswith=prefix).values_list(
            "reference", flat=True
        )
        max_num = 0
        for ref in refs:
            try:
                suffix = ref.split("-")[-1]
                max_num = max(max_num, int(suffix))
            except (ValueError, IndexError, AttributeError):
                continue
        return f"{prefix}{max_num + 1:03d}"

    def save(self, *args, **kwargs):
        # Chaque tentative sous transaction.atomic() : sous Postgres une IntegrityError
        # invalide la transaction ; sans SAVEPOINT (nested atomic), les réessais après
        # collision sur ``reference`` unique échouent et masquent la vraie cause (création
        # liste VP depuis une vue déjà dans ``transaction.atomic()``).
        if self.reference:
            with transaction.atomic():
                super().save(*args, **kwargs)
            return

        year = (
            self.date_visite.year
            if self.date_visite
            else timezone.localdate().year
        )

        # Plusieurs INSERT concurrents peuvent encore choisir le même N ; on réessaie.
        for _attempt in range(12):
            self.reference = self._next_vp_reference_for_year(year)
            try:
                with transaction.atomic():
                    super().save(*args, **kwargs)
                return
            except IntegrityError:
                self.reference = ""

        raise IntegrityError(
            "Impossible d'attribuer une référence VP unique après plusieurs tentatives."
        )


class LigneVisitePeriodique(models.Model):
    """Ligne salarié sur une liste de visite périodique."""

    PRESENCE_NON_RENSEIGNEE = "NON_RENSEIGNEE"
    PRESENCE_PRESENT = "PRESENT"
    PRESENCE_ABSENT = "ABSENT"

    PRESENCE_CHOICES = [
        (PRESENCE_NON_RENSEIGNEE, "Non renseignée"),
        (PRESENCE_PRESENT, "Présent"),
        (PRESENCE_ABSENT, "Absent"),
    ]

    liste = models.ForeignKey(
        ListeVisitePeriodique,
        on_delete=models.CASCADE,
        related_name="lignes",
    )
    collaborateur = models.ForeignKey(
        "employees.Collaborateur",
        on_delete=models.PROTECT,
        related_name="lignes_visite_periodique",
    )
    presence = models.CharField(
        max_length=20,
        choices=PRESENCE_CHOICES,
        default=PRESENCE_NON_RENSEIGNEE,
    )
    fiche_aptitude = models.ForeignKey(
        "medical_work.FicheAptitude",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="lignes_visite_periodique",
    )
    sms_jour_j_envoye = models.BooleanField(
        default=False,
        verbose_name="SMS jour J (file) envoyé",
    )

    class Meta:
        ordering = ["id"]
        db_table = "lignes_visite_periodique"
        verbose_name = "Ligne visite périodique"
        verbose_name_plural = "Lignes visites périodiques"
        constraints = [
            models.UniqueConstraint(
                fields=["liste", "collaborateur"],
                name="uniq_liste_vp_collaborateur",
            ),
        ]

    def __str__(self):
        return f"{self.liste_id} — {self.collaborateur_id}"
