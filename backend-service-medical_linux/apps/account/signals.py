from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User, Group

from apps.account.models.profil_models import Profile
from apps.account.models.infirmier_models import Infirmier
from apps.account.models.medecin_models import Medecin
from apps.account.models.rh_models import RH
from apps.account.models.HSEE_models import HSEE

MEDECIN_GROUP_NAMES = ("Medecin_Traitant", "Medecin_Travail", "Medecin_Controleur")
MED_TYPE_TO_GROUP = {
    "traitant": "Medecin_Traitant",
    "travail": "Medecin_Travail",
    "controleur": "Medecin_Controleur",
    "contrôleur": "Medecin_Controleur",
}


# -------------------------------
# Créer automatiquement Profile quand un User est créé
# -------------------------------
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


# -------------------------------
# Assigner le groupe Django selon le rôle du Profile
# -------------------------------
@receiver(post_save, sender=Profile)
def sync_profile_groups(sender, instance, **kwargs):
    """
    Synchronise les groupes Django du user avec le rôle du Profile.
    Retire tous les anciens groupes, puis assigne le groupe correspondant au rôle.
    Si rôle médecin, tente de trouver le Medecin et son med_type pour assigner
    Medecin_Traitant / Medecin_Travail / Medecin_Controleur.
    """
    user = instance.user
    user.groups.clear()

    role = instance.role

    if role == "infirmier":
        group = Group.objects.filter(name="Infirmier").first()
        if group:
            user.groups.add(group)
    elif role == "rh":
        group = Group.objects.filter(name="RH").first()
        if group:
            user.groups.add(group)
    elif role == "hsse":
        group = Group.objects.filter(name="HSSE").first()
        if group:
            user.groups.add(group)
    elif role == "medecin":
        try:
            medecin = Medecin.objects.get(profile=instance)
            if medecin.med_type_id:
                med_type_name = medecin.med_type.name
                group_name = MED_TYPE_TO_GROUP.get(med_type_name)
                if group_name:
                    group = Group.objects.filter(name=group_name).first()
                    if group:
                        user.groups.add(group)
        except Medecin.DoesNotExist:
            pass


# -------------------------------
# Assigner le groupe médecin selon Medecin.med_type
# -------------------------------
@receiver(post_save, sender=Medecin)
def sync_medecin_groups(sender, instance, **kwargs):
    """
    Retire les anciens groupes médecin du user, puis assigne le groupe
    correspondant à medecin.med_type.name (traitant / travail / controleur).
    """
    user = instance.profile.user

    for group in Group.objects.filter(name__in=MEDECIN_GROUP_NAMES):
        user.groups.remove(group)

    if instance.med_type_id and instance.med_type.name:
        group_name = MED_TYPE_TO_GROUP.get(instance.med_type.name)
        if group_name:
            group = Group.objects.filter(name=group_name).first()
            if group:
                user.groups.add(group)


# -------------------------------
# Créer automatiquement l'objet métier selon le rôle
# -------------------------------
@receiver(post_save, sender=Profile)
def create_role_object(sender, instance, **kwargs):
    """
    Crée automatiquement l'objet métier correspondant
    à un Profile selon son rôle.

    Fonctionne même si le rôle est ajouté ou modifié après la création.
    """
    role = instance.role

    if role == "infirmier":
        Infirmier.objects.get_or_create(profile=instance)

    elif role == "medecin":
        Medecin.objects.get_or_create(profile=instance)

    elif role == "rh":
        RH.objects.get_or_create(profile=instance)

    elif role == "hsse":
        HSEE.objects.get_or_create(profile=instance)