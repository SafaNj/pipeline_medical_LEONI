# -*- coding: utf-8 -*-
# apps/stock/models/medicament_models.py
from django.db import models


class Medicament(models.Model):
    """
    Modele medicament.

    LOGIQUE DE STOCK :
    `unite`                  = unite de DISPENSATION (ce qu'on donne au patient)
                                 ex: comprime, ampoule, millilitre
    `qte_par_conditionnement`= nombre d'unites de dispensation par conditionnement recu
                                 ex: 30 comprimes par boite
    Le stock (StockMedicament.quantite) est TOUJOURS en unites de dispensation
    A l'entree de stock : si on recoit 2 boites de 30 cp -> on ajoute 60 comprimes
    """

    UNITE_CHOICES = [
        ('comprime',      'Comprime'),
        ('ampoule',       'Ampoule'),
        ('millilitre',    'Millilitre'),
        ('sachet',        'Sachet'),
        ('gelule',        'Gelule'),
        ('suppositoire',  'Suppositoire'),
        ('patch',         'Patch'),
        ('unite',         'Unite'),
        ('autre',         'Autre'),
    ]

    CONDITIONNEMENT_CHOICES = [
        ('boite',     'Boite'),
        ('flacon',    'Flacon'),
        ('tube',      'Tube'),
        ('sachet',    'Sachet'),
        ('plaquette', 'Plaquette'),
        ('unite',     'Unite'),
        ('autre',     'Autre'),
    ]

    nom    = models.CharField(max_length=120)
    dosage = models.CharField(max_length=120, blank=True, default='')
    site = models.ForeignKey(
        'account.Site',
        on_delete=models.PROTECT,
        null=False,
        blank=False,
        related_name='medicaments',
    )

    unite = models.CharField(
        max_length=20,
        choices=UNITE_CHOICES,
        default='comprime',
        verbose_name='Unite de dispensation',
        help_text='Unite dans laquelle on donne au patient (comprime, ampoule...)',
    )
    unite_personnalise = models.CharField(
        max_length=60,
        blank=True,
        default='',
        verbose_name='Unite personnalisee',
        help_text="Libelle si unite='autre' (ex: goutte, dose, puff)",
    )
    conditionnement = models.CharField(
        max_length=20,
        choices=CONDITIONNEMENT_CHOICES,
        default='boite',
        verbose_name='Conditionnement',
        help_text='Emballage dans lequel le medicament est recu (boite, flacon...)',
    )
    conditionnement_personnalise = models.CharField(
        max_length=60,
        blank=True,
        default='',
        verbose_name='Conditionnement personnalise',
        help_text="Rempli uniquement si conditionnement='autre'",
    )
    qte_par_conditionnement = models.PositiveIntegerField(
        default=1,
        verbose_name='Qte par conditionnement',
        help_text="Nombre d'unites de dispensation par conditionnement. Ex: 30 comprimes/boite",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['nom']

    def __str__(self):
        label = f"{self.nom} {self.dosage}".strip()
        return f"{label} ({self.get_unite_display()})"