from django.db import models
from django.utils import timezone
from .contre_visite_models import ContreVisite


class ControleMedical(models.Model):
    """
    Document officiel PDF généré après une contre-visite.
    Envoyé au service RH.
    
    Champs du document :
    - Matricule
    - Nom
    - Prénom
    - Repos prescrit
    - Segment
    - Avis du médecin contrôleur
    - Cachet et signature
    """
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # RELATION AVEC CONTRE-VISITE (1:1)
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    contre_visite = models.OneToOneField(
        ContreVisite,
        on_delete=models.CASCADE,
        related_name='controle_medical',
        verbose_name="Contre-visite"
    )
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # INFORMATIONS DU DOCUMENT
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    matricule = models.CharField(
        max_length=50,
        verbose_name="Matricule",
        help_text="Matricule du collaborateur"
    )
    
    nom = models.CharField(
        max_length=150,
        verbose_name="Nom",
        help_text="Nom du collaborateur"
    )
    
    prenom = models.CharField(
        max_length=150,
        verbose_name="Prénom",
        help_text="Prénom du collaborateur"
    )
    
    repos_prescrit = models.CharField(
        max_length=200,
        verbose_name="Repos prescrit",
        help_text="Ex: 20 jours à partir du 02/01/2026"
    )
    
    segment = models.CharField(
        max_length=100,
        verbose_name="Segment",
        help_text="Segment/Département du collaborateur"
    )
    
    avis_medecin_controleur = models.TextField(
        verbose_name="Avis du médecin contrôleur",
        help_text="Avis médical détaillé"
    )
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # NUMÉRO ET FICHIER PDF
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    numero_controle = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="N° Contrôle",
        help_text="Numéro unique (ex: CM-2026-001)"
    )
    
    date_emission = models.DateField(
        default=timezone.localdate,
        verbose_name="Date d'émission"
    )
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # DISTRIBUTION
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    envoye_rh = models.BooleanField(
        default=False,
        verbose_name="Envoyé au RH"
    )
    
    date_envoi_rh = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date d'envoi au RH"
    )
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # DATES SYSTÈME
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    date_creation = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )
    
    date_modification = models.DateTimeField(
        auto_now=True,
        verbose_name="Dernière modification"
    )
    
    class Meta:
        db_table = 'controles_medicaux'
        verbose_name = 'Contrôle Médical'
        verbose_name_plural = 'Contrôles Médicaux'
        ordering = ['-date_emission']
    
    def __str__(self):
        return f"CM {self.numero_controle} - {self.nom} {self.prenom}"
    
    def save(self, *args, **kwargs):
        """
        Auto-générer numéro et copier données depuis ContreVisite
        """
        # Générer numéro si pas défini
        if not self.numero_controle:
            year = timezone.now().year
            last_cm = ControleMedical.objects.filter(
                numero_controle__startswith=f'CM-{year}-'
            ).order_by('-numero_controle').first()
            
            if last_cm:
                last_num = int(last_cm.numero_controle.split('-')[-1])
                next_num = last_num + 1
            else:
                next_num = 1
            
            self.numero_controle = f'CM-{year}-{next_num:03d}'
        
        # Copier données depuis ContreVisite
        if self.contre_visite_id:
            cv = self.contre_visite
            
            # Copier matricule
            if not self.matricule:
                self.matricule = cv.matricule
            
            # Séparer nom et prénom
            if not self.nom or not self.prenom:
                nom_complet = cv.nom_prenom.split()
                if len(nom_complet) >= 2:
                    self.prenom = nom_complet[0]
                    self.nom = ' '.join(nom_complet[1:])
                else:
                    self.nom = cv.nom_prenom
            
            # Générer repos prescrit
            if not self.repos_prescrit:
                self.repos_prescrit = f"{cv.duree_repos} jours à partir du {cv.a_partir.strftime('%d/%m/%Y')}"
            
            # Copier segment (depuis collaborateur si disponible)
            if not self.segment and cv.item_passage:
                if cv.item_passage.collaborateur:
                    collab = cv.item_passage.collaborateur
                    self.segment = getattr(collab, 'department', 'N/A')
            
            # Copier avis si pas défini
            if not self.avis_medecin_controleur:
                self.avis_medecin_controleur = cv.remarque or "Avis médical à compléter"
        
        super().save(*args, **kwargs)