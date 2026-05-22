from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.db import models


class DocumentMedicalScanne(models.Model):
    """
    Archives PDF / images déposées par l'infirmerie : fiche médicale et/ou dossier médical
    existant hors application.
    Le collaborateur peut être vide si le scan concerne un candidat (matricule_ref seul).
    """

    TYPE_FICHE_MEDICALE = "FICHE_MEDICALE"
    TYPE_DOSSIER_MEDICAL = "DOSSIER_MEDICAL"
    TYPE_CHOICES = [
        (TYPE_FICHE_MEDICALE, "Fiche médicale (scan)"),
        (TYPE_DOSSIER_MEDICAL, "Dossier médical (scan)"),
    ]

    collaborateur = models.ForeignKey(
        "employees.Collaborateur",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents_scannes",
        verbose_name="Collaborateur",
    )
    matricule_ref = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Matricule (candidat / référence)",
        help_text="Obligatoire si pas de collaborateur (ex. candidat embauche non encore créé).",
    )
    type_document = models.CharField(
        max_length=32,
        choices=TYPE_CHOICES,
        verbose_name="Type de document",
    )
    fichier = models.FileField(
        upload_to="act_infirmier/scans/%Y/%m/",
        validators=[FileExtensionValidator(["pdf", "jpg", "jpeg", "png"])],
        verbose_name="Fichier (PDF ou image)",
    )
    titre = models.CharField(max_length=255, blank=True, verbose_name="Titre / libellé")
    commentaire = models.TextField(blank=True, verbose_name="Commentaire")
    date_document = models.DateField(
        null=True,
        blank=True,
        verbose_name="Date du document (papier)",
        help_text="Optionnel : date figurant sur le document scanné.",
    )
    depose_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="documents_medicaux_deposes",
        verbose_name="Déposé par",
    )
    date_depot = models.DateTimeField(auto_now_add=True, verbose_name="Date de dépôt")

    class Meta:
        ordering = ["-date_depot"]
        verbose_name = "Document médical scanné"
        verbose_name_plural = "Documents médicaux scannés"

    def __str__(self):
        if self.collaborateur_id:
            try:
                ref = self.collaborateur.matricule
            except Exception:
                ref = self.matricule_ref or "?"
        else:
            ref = self.matricule_ref or "?"
        return f"{self.get_type_document_display()} — {ref} — {self.date_depot.date()}"
