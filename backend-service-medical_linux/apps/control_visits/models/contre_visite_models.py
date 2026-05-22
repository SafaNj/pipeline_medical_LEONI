from django.db import models
from apps.account.models import Medecin


class ContreVisite(models.Model):
    """
    Ligne du tableau Excel des contre-visites.
    
    Le médecin peut :
    - Soit sélectionner un ItemPassage (auto-remplissage partiel)
    - Soit tout saisir manuellement
    
    Colonnes Excel : N° | Matricule | Docteur | Nom et Prénom | Durée de repos | À partir | Remarque | Date
    """
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # LIEN OPTIONNEL AVEC ITEMPASSAGE
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    item_passage = models.OneToOneField(
        'planning.ItemPassage',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contre_visite',
        verbose_name="Item de passage",
        help_text="Optionnel : lien vers la liste de passage"
    )
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # COLONNES EXCEL (toutes éditables)
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    numero_ordre = models.PositiveIntegerField(
        verbose_name="N°",
        help_text="Auto-généré",
        editable=False
    )
    
    matricule = models.CharField(
        max_length=50,
        verbose_name="Matricule",
        help_text="Matricule du collaborateur"
    )
    
    nom_prenom = models.CharField(
        max_length=255,
        verbose_name="Nom et Prénom",
        help_text="Nom complet du collaborateur"
    )
    
    duree_repos = models.PositiveIntegerField(
        verbose_name="Durée de repos",
        help_text="Durée en jours (validée par le médecin contrôleur)",
    )
    refus_repos = models.BooleanField(
        default=False,
        verbose_name="Refus de repos",
        help_text="Si coché, comptabilisé en « contre-visite refus » (HSEE).",
    )

    repos_initial = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="Repos initial (médecin traitant)",
        help_text="Durée de repos initialement prescrite par le médecin traitant (en jours)"
    )
    
    a_partir = models.DateField(
        verbose_name="À partir",
        help_text="Date de début de l'arrêt"
    )
    
    remarque = models.TextField(
        blank=True,
        verbose_name="Remarque",
        help_text="Remarque du médecin"
    )
    
    date = models.DateField(
        verbose_name="Date",
        help_text="Date de la contre-visite"
    )
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # RELATION MÉDECIN
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    medecin_controleur = models.ForeignKey(
        Medecin,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contre_visites',
        verbose_name="Médecin contrôleur"
    )

    site = models.ForeignKey(
        'account.Site',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contre_visites',
        verbose_name='Site',
    )
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # DATES SYSTÈME
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    date_creation = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )
    
    class Meta:
        db_table = 'contre_visites'
        verbose_name = 'Contre-Visite'
        verbose_name_plural = 'Contre-Visites'
        ordering = ['-date', 'numero_ordre']
    
    def __str__(self):
        return f"CV #{self.numero_ordre} - {self.nom_prenom} ({self.date})"
    
    def save(self, *args, **kwargs):
        """
        Auto-incrémenter numero_ordre et pré-remplir depuis item_passage
        """
        # Auto-incrémenter numero_ordre
        if not self.numero_ordre:
            last = ContreVisite.objects.all().order_by('-numero_ordre').first()
            self.numero_ordre = (last.numero_ordre + 1) if last else 1
        
        # Pré-remplir depuis item_passage
        if self.item_passage_id:
            item = self.item_passage
            
            # Pré-remplir collaborateur si vide
            if item.collaborateur and not self.nom_prenom:
                collab = item.collaborateur
                self.matricule = collab.matricule
                try:
                    full_name = f"{collab.nom} {collab.prenom}".strip()
                    self.nom_prenom = full_name or (collab.matricule or "")
                except Exception:
                    self.nom_prenom = collab.matricule or ""
        
        super().save(*args, **kwargs)
        
        # Marquer ItemPassage comme EFFECTUEE si lié
        if self.item_passage_id:
            self.item_passage.statut = 'EFFECTUEE'
            self.item_passage.save(update_fields=['statut'])