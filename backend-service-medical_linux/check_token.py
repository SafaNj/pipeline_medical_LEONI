import django, os
os.environ['DJANGO_SETTINGS_MODULE'] = 'medical_platform.settings'
django.setup()

from apps.account.models import Medecin
import inspect

# Voir les champs du modèle Medecin
med = Medecin.objects.select_related('profile__user', 'site').first()
if med:
    print("=== Champs du modèle Medecin ===")
    for field in med._meta.get_fields():
        try:
            val = getattr(med, field.name, 'N/A')
            print(f"  {field.name} = {val}")
        except:
            print(f"  {field.name} = (erreur lecture)")