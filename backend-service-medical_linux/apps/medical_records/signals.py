"""
Création automatique d'un DossierMedical lors de la création d'un Collaborateur
(les données seront complétées par le médecin du travail lors de la visite d'embauche).
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.employees.models import Collaborateur
from apps.medical_records.models import DossierMedical


@receiver(post_save, sender=Collaborateur)
def creer_dossier_medical_si_absent(sender, instance, created, **kwargs):
    if not created:
        return
    nom = (getattr(instance, "nom", None) or "").strip()
    prenom = (getattr(instance, "prenom", None) or "").strip()
    DossierMedical.objects.get_or_create(
        collaborateur=instance,
        defaults={
            "nom": nom or "—",
            "prenom": prenom or "—",
            "matricule_ref": instance.matricule,
        },
    )
