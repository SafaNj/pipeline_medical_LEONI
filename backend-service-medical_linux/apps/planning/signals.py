from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.planning.models import ItemPassage, ListePassage


@receiver(post_save, sender=ItemPassage)
def reopen_liste_if_new_waiting_item(sender, instance, created, **kwargs):
    """
    Quand un nouvel item EN_ATTENTE est ajouté à une liste TERMINEE,
    remettre automatiquement la liste en ACTIVE pour que le médecin
    puisse continuer à traiter des patients.
    La liste ne se ferme plus automatiquement.
    """
    if created and instance.statut == ItemPassage.STATUS_WAITING:
        liste = instance.liste
        if liste.statut == ListePassage.STATUS_DONE:
            liste.statut = ListePassage.STATUS_ACTIVE
            liste.save(update_fields=["statut", "updated_at"])