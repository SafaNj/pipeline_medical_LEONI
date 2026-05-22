from django.core.management.base import BaseCommand

from apps.embauche.embauche_sms import envoyer_rappels_veille_j_moins_1


class Command(BaseCommand):
    help = "Envoie les SMS veille (J-1) pour les listes d'embauche (date_visite = demain)."

    def handle(self, *args, **options):
        n = envoyer_rappels_veille_j_moins_1()
        self.stdout.write(self.style.SUCCESS(f"Listes embauche traitees (SMS veille): {n}"))
