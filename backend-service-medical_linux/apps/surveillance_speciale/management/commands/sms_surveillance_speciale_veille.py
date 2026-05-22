from django.core.management.base import BaseCommand

from apps.surveillance_speciale.surveillance_speciale_sms import envoyer_rappels_veille_j_moins_1


class Command(BaseCommand):
    help = "Envoie les SMS veille (J-1) pour les listes de surveillance médicale spéciale."

    def handle(self, *args, **options):
        n = envoyer_rappels_veille_j_moins_1()
        self.stdout.write(self.style.SUCCESS(f"Listes surveillance spéciale traitées (SMS veille): {n}"))
