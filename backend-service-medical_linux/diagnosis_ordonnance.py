#!/usr/bin/env python
"""
Diagnostic détaillé du problème d'ordonnances
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medical_platform.settings')
django.setup()

from apps.consultations.models import Ordonnance, LigneOrdonnance
from apps.consultations.serializers import OrdonnanceSerializer
from apps.stock.models import Medicament

# Vérifier les ordonnances existantes
print("=" * 70)
print("ORDONNANCES EXISTANTES")
print("=" * 70)

ordonnances = Ordonnance.objects.prefetch_related('lignes_ordonnance').all()
print(f"\nTotal d'ordonnances: {ordonnances.count()}")

for ordonnance in ordonnances[:3]:  # Afficher les 3 premières
    print(f"\nOrdonnance #{ordonnance.id}")
    print(f"  - consultation_id: {ordonnance.consultation_id}")
    print(f"  - date_emission: {ordonnance.date_emission}")
    print(f"  - Nombre de lignes: {ordonnance.lignes_ordonnance.count()}")
    
    # Afficher les lignes
    for ligne in ordonnance.lignes_ordonnance.all()[:3]:
        print(f"    Ligne #{ligne.id}")
        print(f"      - texte: {ligne.texte}")
        print(f"      - medicament_id: {ligne.medicament_id}")
        print(f"      - statut: {ligne.statut}")

# Afficher les médicaments disponibles
print("\n" + "=" * 70)
print("MÉDICAMENTS DISPONIBLES")
print("=" * 70)

medicaments = Medicament.objects.all()
print(f"\nTotal de médicaments: {medicaments.count()}")

for medicament in medicaments:
    print(f"  - #{medicament.id}: {medicament.nom} ({medicament.dosage})")

# Vérifier les associations manquantes
print("\n" + "=" * 70)
print("PROBLÈMES DÉTECTÉS")
print("=" * 70)

lignes = LigneOrdonnance.objects.all()
total_lignes = lignes.count()
lignes_sans_medicament = lignes.filter(medicament__isnull=True).count()
pourcentage = (lignes_sans_medicament / total_lignes * 100) if total_lignes > 0 else 0

print(f"\n⚠️  {lignes_sans_medicament}/{total_lignes} lignes ({pourcentage:.1f}%) n'ont pas de médicament lié")

# Afficher les médicaments par nom pour voir s'il y a une correspondance textuelle possible
print("\n" + "=" * 70)
print("ANALYSE DES TEXTES DE LIGNES vs MÉDICAMENTS")
print("=" * 70)

lignes_uniques = set(LigneOrdonnance.objects.values_list('texte', flat=True))
print(f"\nTextes de lignes trouvés ({len(lignes_uniques)} uniques):")
for texte in sorted(lignes_uniques):
    print(f"  - '{texte}'")

medicaments_noms = set(Medicament.objects.values_list('nom', flat=True))
print(f"\nNoms de médicaments ({len(medicaments_noms)} uniques):")
for nom in sorted(medicaments_noms):
    print(f"  - '{nom}'")

# Chercher les correspondances
print(f"\nCorrespondances trouvées:")
matches_found = False
for texte in lignes_uniques:
    for nom in medicaments_noms:
        if texte.lower() == nom.lower() or texte.lower() in nom.lower():
            print(f"  ✓ '{texte}' correspond à '{nom}'")
            matches_found = True

if not matches_found:
    print(f"  ✗ Aucune correspondance trouvée")

print("\n" + "=" * 70)
print("RECOMMANDATIONS")
print("=" * 70)

if lignes_sans_medicament > 0:
    print(f"""
1. ❌ {lignes_sans_medicament} lignes n'ont pas de médicament lié
   → Les ordonnances ne peuvent pas afficher correctement les informations médicament
   
2. 📋 Solutions possibles:
   a) Vérifier comment le frontend envoie les données lors de la création
   b) S'assurer que le medicament_id est envoyé dans les requêtes POST/PUT
   c) Vérifier le serializer LigneOrdonnanceSerializer.create()
   
3. 🔗 Vérifier que:
   - Le frontend sélectionne un médicament avant de créer la ligne
   - Le medicament_id est inclus dans la requête API
   - Le serializer accepte et traite le medicament_id correctement
""")
