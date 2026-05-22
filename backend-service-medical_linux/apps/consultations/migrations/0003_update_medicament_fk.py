import django.db.models.deletion
from django.db import migrations, models


def copy_medicaments_to_stock(apps, schema_editor):
    OldMedicament = apps.get_model('consultations', 'Medicament')
    NewMedicament = apps.get_model('stock', 'Medicament')

    for old in OldMedicament.objects.all().order_by('id'):
        NewMedicament.objects.update_or_create(
            id=old.id,
            defaults={
                'nom': old.nom,
                'dosage': old.dosage,
                'created_at': old.created_at,
            },
        )


def copy_medicaments_back_to_consultations(apps, schema_editor):
    OldMedicament = apps.get_model('consultations', 'Medicament')
    NewMedicament = apps.get_model('stock', 'Medicament')

    for med in NewMedicament.objects.all().order_by('id'):
        OldMedicament.objects.update_or_create(
            id=med.id,
            defaults={
                'nom': med.nom,
                'dosage': med.dosage,
                'created_at': med.created_at,
            },
        )


class Migration(migrations.Migration):

    dependencies = [
        ('consultations', '0002_ligne_ordonnance'),
        ('stock', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(
            copy_medicaments_to_stock,
            copy_medicaments_back_to_consultations,
        ),
        migrations.AlterField(
            model_name='ligneordonnance',
            name='medicament',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lignes_ordonnance', to='stock.medicament'),
        ),
        migrations.DeleteModel(
            name='Medicament',
        ),
    ]
