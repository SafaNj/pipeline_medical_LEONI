#!/usr/bin/env python
"""
Script pour corriger les lignes d'ordonnance sans médicament lié
et implémenter une fonction de matching automatique
"""
import os
import sys
import django
import re

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medical_platform.settings')
django.setup()

from apps.consultations.models import LigneOrdonnance
from apps.stock.models import Medicament

def find_medicament_by_text(texte):
    """
    Essaie de trouver un médicament basé sur le texte de la ligne.
    Stratégies:
    1. Exact match (insensible à la casse)
    2. Partial match (le nom du médicament est dans le texte)
    3. Extraction du premier mot et match
    """
    if not texte:
        return None
    
    # Stratégie 1: Exact match
    medicaments = Medicament.objects.filter(nom__iexact=texte.strip())
    if medicaments.exists():
        return medicaments.first()
    
    # Stratégie 2: Match du premier mot
    premier_mot = texte.strip().split()[0]
    medicaments = Medicament.objects.filter(nom__iexact=premier_mot)
    if medicaments.exists():
        return medicaments.first()
    
    # Stratégie 3: Match du nom du médicament dans le texte
    medicaments = Medicament.objects.all()
    for med in medicaments:
        if med.nom.lower() in texte.lower():
            return med
    
    return None

# Corriger les lignes existantes
print("=" * 70)
print("CORRECTION DES LIGNES D'ORDONNANCE")
print("=" * 70)

lignes_sans_medicament = LigneOrdonnance.objects.filter(medicament__isnull=True)
print(f"\nTraitement de {lignes_sans_medicament.count()} lignes sans médicament...")

corrections = {
    'matched': [],
    'unmatched': []
}

for ligne in lignes_sans_medicament:
    medicament = find_medicament_by_text(ligne.texte)
    
    if medicament:
        ligne.medicament = medicament
        ligne.save()
        corrections['matched'].append({
            'ligne_id': ligne.id,
            'texte': ligne.texte,
            'medicament': medicament.nom
        })
        print(f"  ✓ Ligne #{ligne.id}: '{ligne.texte}' → Médicament: {medicament.nom}")
    else:
        corrections['unmatched'].append({
            'ligne_id': ligne.id,
            'texte': ligne.texte
        })
        print(f"  ✗ Ligne #{ligne.id}: '{ligne.texte}' → Aucune correspondance")

# Résumé
print("\n" + "=" * 70)
print("RÉSUMÉ")
print("=" * 70)
print(f"""
✓ Lignes corrigées: {len(corrections['matched'])}
✗ Lignes non corrigées: {len(corrections['unmatched'])}

Lignes non corrigées (action manuelle requise):
""")
for item in corrections['unmatched']:
    print(f"  - Ligne #{item['ligne_id']}: '{item['texte']}'")

# Vérifier le résultat
lignes_restantes = LigneOrdonnance.objects.filter(medicament__isnull=True).count()
print(f"\nLignes sans médicament après correction: {lignes_restantes}")
if lignes_restantes == 0:
    print("✅ Toutes les lignes ont maintenant un médicament lié !")
