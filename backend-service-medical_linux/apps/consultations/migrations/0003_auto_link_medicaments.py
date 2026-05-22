# Generated migration to fix ordonnance medicament links
# This migration links existing LigneOrdonnance to Medicament based on text matching

from django.db import migrations
from django.db.models import Q


def link_medicaments_to_lignes(apps, schema_editor):
    """Link LigneOrdonnance to Medicament based on text matching"""
    LigneOrdonnance = apps.get_model('consultations', 'LigneOrdonnance')
    Medicament = apps.get_model('stock', 'Medicament')
    
    # Get all lignes without medicament
    lignes_sans_medicament = LigneOrdonnance.objects.filter(medicament__isnull=True)
    
    updated_count = 0
    
    for ligne in lignes_sans_medicament:
        if not ligne.texte:
            continue
        
        # Strategy 1: Exact match (case insensitive)
        medicament = Medicament.objects.filter(nom__iexact=ligne.texte.strip()).first()
        
        if not medicament:
            # Strategy 2: First word match
            premier_mot = ligne.texte.strip().split()[0] if ligne.texte.strip() else ''
            if premier_mot:
                medicament = Medicament.objects.filter(nom__iexact=premier_mot).first()
        
        if not medicament:
            # Strategy 3: Partial match (medicament name in text)
            for med in Medicament.objects.all():
                if med.nom.lower() in ligne.texte.lower():
                    medicament = med
                    break
        
        if medicament:
            ligne.medicament = medicament
            ligne.save()
            updated_count += 1
    
    print(f"Linked {updated_count} LigneOrdonnance to Medicament")


def reverse_link_medicaments(apps, schema_editor):
    """Reverse: Clear medicament links for lignes (only for recently created ones)"""
    pass  # We keep the links


class Migration(migrations.Migration):

    dependencies = [
        ('consultations', '0002_ligne_ordonnance'),  # Adjust based on your latest migration
    ]

    operations = [
        migrations.RunPython(link_medicaments_to_lignes, reverse_link_medicaments),
    ]
