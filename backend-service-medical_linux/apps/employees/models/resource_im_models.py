from django.db import models


class ResourceIM(models.Model):
    id = models.AutoField(primary_key=True)
    matricule = models.IntegerField(unique=True)
    name = models.CharField(max_length=150, null=True, blank=True)
    firstname = models.CharField(max_length=150, null=True, blank=True)
    lastname = models.CharField(max_length=200, null=True, blank=True)
    CIN = models.CharField(max_length=20, null=True, blank=True)
    date_naissance = models.CharField(max_length=20, null=True, blank=True)
    sex = models.CharField(max_length=10, null=True, blank=True)
    lieu_naissance = models.CharField(max_length=150, null=True, blank=True)
    telephone = models.CharField(max_length=30, null=True, blank=True)
    mail = models.CharField(max_length=150, null=True, blank=True)
    adress = models.TextField(null=True, blank=True)
    adr_ville = models.CharField(max_length=100, null=True, blank=True)
    adr_gouv = models.CharField(max_length=100, null=True, blank=True)
    gouvernorat_act = models.IntegerField(null=True, blank=True)
    Code_postal = models.CharField(max_length=10, null=True, blank=True)
    fonction = models.CharField(max_length=150, null=True, blank=True)
    department = models.CharField(max_length=150, null=True, blank=True)
    ccenter = models.CharField(max_length=100, null=True, blank=True)
    niveau = models.CharField(max_length=50, null=True, blank=True)
    Qualification = models.CharField(max_length=100, null=True, blank=True)
    specialite = models.CharField(max_length=150, null=True, blank=True)
    affectation = models.CharField(max_length=150, null=True, blank=True)
    date_embauche = models.CharField(max_length=20, null=True, blank=True)
    date_entree = models.CharField(max_length=20, null=True, blank=True)
    CNSS = models.CharField(max_length=50, null=True, blank=True)
    status_actif = models.CharField(max_length=50, null=True, blank=True)
    Situation_familiale = models.CharField(max_length=30, null=True, blank=True)
    region = models.CharField(max_length=50, null=True, blank=True)
    site = models.CharField(max_length=50, null=True, blank=True)

    med_visite_embauche_effectuee = models.BooleanField(default=False)
    med_date_visite_embauche = models.DateField(null=True, blank=True)
    med_resultat_aptitude = models.CharField(max_length=50, null=True, blank=True)
    med_date_resultat_aptitude = models.DateField(null=True, blank=True)
    med_statut_integration = models.CharField(max_length=30, default='EN_ATTENTE')
    med_date_integration = models.DateField(null=True, blank=True)
    med_validateur_integration = models.CharField(max_length=20, null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'resource'
        app_label = 'employees'

    def __str__(self):
        return f'{self.name} {self.firstname} ({self.matricule})'
