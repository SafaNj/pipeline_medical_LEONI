from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.medical_work.date_utils import add_calendar_months
from apps.medical_work.models import FicheAptitude


@receiver(post_save, sender=FicheAptitude)
def remplir_date_prochaine_visite_vp(sender, instance, **kwargs):
    """
    Si une fiche PERIODIQUE n'a pas date_prochaine_visite, la déduire de la date de visite
    et validite_mois (défaut 12), même logique que les alertes (mois calendaires).
    """
    if instance.type_visite != "PERIODIQUE":
        return
    dpv = instance.date_prochaine_visite
    dv = instance.date_visite
    if dpv and dv and dpv >= dv:
        return
    mois = getattr(instance, "validite_mois", None) or 12
    try:
        mois = int(mois)
    except (TypeError, ValueError):
        mois = 12
    if mois <= 0:
        mois = 12
    if not instance.date_visite:
        return
    prochaine = add_calendar_months(instance.date_visite, mois)
    FicheAptitude.objects.filter(pk=instance.pk).update(date_prochaine_visite=prochaine)
