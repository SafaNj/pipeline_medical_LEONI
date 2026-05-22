from django.conf import settings
from django.db import models


class DeclarationCNAM(models.Model):
    collaborateur = models.ForeignKey(
        "employees.Collaborateur",
        on_delete=models.PROTECT,
        related_name="declarations_cnam",
    )
    site = models.ForeignKey(
        "account.Site",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="declarations_cnam",
    )
    matricule_cnss = models.CharField(max_length=50, blank=True, editable=False)

    type_accident = models.CharField(max_length=255)
    date_accident = models.DateField()

    chauffeur = models.CharField(max_length=255)
    date_collecte_chauffeur = models.DateField(null=True, blank=True)
    date_cachet_cnam = models.DateField(null=True, blank=True)
    date_limite_declaration = models.DateField(null=True, blank=True)

    nb_jours_retard = models.IntegerField(default=0, editable=False)

    cause_retard = models.TextField(blank=True)
    commentaire = models.TextField(blank=True)
    actions = models.TextField(blank=True)
    correction = models.TextField(blank=True)

    infirmiere = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="declarations_cnam_saisies",
        editable=False,
    )
    date_creation = models.DateTimeField(auto_now_add=True, editable=False)

    class Meta:
        ordering = ["-date_accident", "-date_creation"]
        verbose_name = "Declaration CNAM"
        verbose_name_plural = "Declarations CNAM"

    def save(self, *args, **kwargs):
        if self.collaborateur:
            self.matricule_cnss = self.collaborateur.numero_cnss or ""

        if self.date_cachet_cnam and self.date_limite_declaration:
            self.nb_jours_retard = (self.date_cachet_cnam - self.date_limite_declaration).days
        else:
            self.nb_jours_retard = 0

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.collaborateur} - {self.type_accident} - {self.date_accident}"
