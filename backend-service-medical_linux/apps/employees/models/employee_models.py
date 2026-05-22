from django.db import models


SEXE_CHOICES = (
    ("M", "Masculin"),
    ("F", "Féminin"),
)


class Collaborateur(models.Model):
    matricule = models.CharField(max_length=50, unique=True)
    numero_cnss = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Numéro CNSS",
    )

    date_naissance = models.DateField(
        null=True,
        blank=True,
        verbose_name="Date de naissance",
    )
    sexe = models.CharField(
        max_length=1,
        choices=SEXE_CHOICES,
        null=True,
        blank=True,
    )
    date_embauche = models.DateField(null=True, blank=True)

    def __str__(self):
        full_name = f"{self.nom} {self.prenom}".strip()
        return full_name or str(self.matricule)

    def _get_im_data(self):
        if not hasattr(self, '_im_data_cache'):
            from apps.embauche.im_sync import get_data_from_im

            try:
                self._im_data_cache = get_data_from_im(self.matricule) or {}
            except Exception:
                self._im_data_cache = {}
        return self._im_data_cache

    def _im_value(self, key):
        return self._get_im_data().get(key) or ''

    @property
    def nom(self):
        return self._im_value('nom')

    @property
    def prenom(self):
        return self._im_value('prenom')

    @property
    def adresse(self):
        return self._im_value('adresse')

    @property
    def telephone(self):
        return self._im_value('telephone')

    @property
    def email(self):
        return self._im_value('email')

    @property
    def poste(self):
        return self._im_value('poste')

    @property
    def department(self):
        return self._im_value('department')

    @property
    def plant_section(self):
        return self._im_value('plant_section')

    @property
    def segment(self):
        return self._im_value('segment')

    @property
    def superieur_hierarchique(self):
        return self._im_value('superieur_hierarchique')

    @property
    def cin(self):
        return self._im_value('cin')

    @property
    def lieu_naissance(self):
        return self._im_value('lieu_naissance')