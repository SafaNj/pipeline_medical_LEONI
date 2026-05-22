#!/usr/bin/env python
"""
Script pour vérifier la création d'ordonnances sans dépendre de la DB
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medical_platform.settings')
django.setup()

from apps.consultations.models import Ordonnance, LigneOrdonnance
from apps.consultations.serializers import OrdonnanceSerializer, LigneOrdonnanceSerializer
from apps.stock.models import Medicament, StockMedicament
from datetime import date

# Afficher les fields du serializer OrdonnanceSerializer
print("=" * 60)
print("ORDONNANCE SERIALIZER ANALYSIS")
print("=" * 60)

serializer = OrdonnanceSerializer()
print(f"\nFields dans OrdonnanceSerializer:")
for field_name, field in serializer.fields.items():
    print(f"  - {field_name}: {field.__class__.__name__} (required: {field.required}, read_only: {field.read_only})")

print(f"\nMeta.fields: {serializer.Meta.fields}")
print(f"Meta.read_only_fields: {serializer.Meta.read_only_fields}")
print(f"Meta.extra_kwargs: {serializer.Meta.extra_kwargs}")

# Afficher les fields du serializer LigneOrdonnanceSerializer
print("\n" + "=" * 60)
print("LIGNE ORDONNANCE SERIALIZER ANALYSIS")
print("=" * 60)

ligne_serializer = LigneOrdonnanceSerializer()
print(f"\nFields dans LigneOrdonnanceSerializer:")
for field_name, field in ligne_serializer.fields.items():
    print(f"  - {field_name}: {field.__class__.__name__} (required: {field.required}, read_only: {field.read_only})")

print(f"\nMeta.fields: {ligne_serializer.Meta.fields}")
print(f"Meta.read_only_fields: {ligne_serializer.Meta.read_only_fields}")

# Afficher le modèle Ordonnance
print("\n" + "=" * 60)
print("ORDONNANCE MODEL ANALYSIS")
print("=" * 60)

ordonnance_model = Ordonnance
print(f"\nChamps du modèle Ordonnance:")
for field in ordonnance_model._meta.get_fields():
    print(f"  - {field.name}: {field.__class__.__name__}")

# Afficher le modèle LigneOrdonnance
print("\n" + "=" * 60)
print("LIGNE ORDONNANCE MODEL ANALYSIS")
print("=" * 60)

ligne_model = LigneOrdonnance
print(f"\nChamps du modèle LigneOrdonnance:")
for field in ligne_model._meta.get_fields():
    print(f"  - {field.name}: {field.__class__.__name__}")

# Vérifier l'existence du modèle Medicament
print("\n" + "=" * 60)
print("MEDICAMENT MODEL CHECK")
print("=" * 60)

try:
    medicament = Medicament.objects.first()
    print(f"✓ Modèle Medicament trouvé dans 'stock'")
    print(f"  Nombre de médicaments en base: {Medicament.objects.count()}")
except Exception as e:
    print(f"✗ Erreur: {e}")

# Vérifier la relation entre LigneOrdonnance et Medicament
print("\n" + "=" * 60)
print("LIGNE ORDONNANCE - MEDICAMENT RELATION")
print("=" * 60)

try:
    # Vérifier les foreign keys
    lignes = LigneOrdonnance.objects.all()
    print(f"Total lignes d'ordonnance: {lignes.count()}")
    
    lignes_avec_medicament = lignes.filter(medicament__isnull=False).count()
    lignes_sans_medicament = lignes.filter(medicament__isnull=True).count()
    
    print(f"  - Avec médicament lié: {lignes_avec_medicament}")
    print(f"  - Sans médicament: {lignes_sans_medicament}")
    
    # Vérifier la sérialisation
    if lignes.exists():
        ligne = lignes.first()
        serialized = LigneOrdonnanceSerializer(ligne)
        print(f"\nExemple de ligne sérialisée:")
        for key, value in serialized.data.items():
            if isinstance(value, (dict, list)):
                print(f"  - {key}: {str(value)[:100]}...")
            else:
                print(f"  - {key}: {value}")
except Exception as e:
    print(f"✗ Erreur: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("Vérification terminée")
print("=" * 60)
