from django.core.management.base import BaseCommand

from apps.visites_periodiques.visite_periodique_sms import envoyer_rappels_veille_j_moins_1


class Command(BaseCommand):
    help = (
        "Envoie les SMS de rappel veille (J-1) pour les listes de visite périodique. "
        "La date « demain » suit TIME_ZONE (ex. Africa/Tunis). "
        "Planifier à l’heure métier souhaitée (ex. 12:00) via cron ou Task Scheduler."
    )

    def handle(self, *args, **options):
        n = envoyer_rappels_veille_j_moins_1()
        self.stdout.write(self.style.SUCCESS(f"Listes traitées : {n}"))
