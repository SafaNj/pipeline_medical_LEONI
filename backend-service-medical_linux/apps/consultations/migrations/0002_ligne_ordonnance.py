from django.db import migrations, models
import django.db.models.deletion


def _split_medicaments_text(raw_value):
    if not raw_value:
        return []

    normalized = str(raw_value).replace('\r', '\n')
    entries = []

    for line in normalized.split('\n'):
        for chunk in line.split(';'):
            value = chunk.strip(' -\t')
            if value:
                entries.append(value)

    if len(entries) == 1 and ',' in entries[0]:
        comma_split = [part.strip() for part in entries[0].split(',') if part.strip()]
        if comma_split:
            entries = comma_split

    return entries


def forwards_copy_medicaments_to_lines(apps, schema_editor):
    Ordonnance = apps.get_model('consultations', 'Ordonnance')
    LigneOrdonnance = apps.get_model('consultations', 'LigneOrdonnance')

    for ordonnance in Ordonnance.objects.exclude(medicaments__isnull=True).exclude(medicaments=''):
        entries = _split_medicaments_text(ordonnance.medicaments)
        for index, texte in enumerate(entries, start=1):
            LigneOrdonnance.objects.create(
                ordonnance_id=ordonnance.id,
                texte=texte,
                statut='EN_ATTENTE',
                ordre=index,
            )


def backwards_copy_lines_to_medicaments(apps, schema_editor):
    Ordonnance = apps.get_model('consultations', 'Ordonnance')
    LigneOrdonnance = apps.get_model('consultations', 'LigneOrdonnance')

    for ordonnance in Ordonnance.objects.all():
        lignes = LigneOrdonnance.objects.filter(ordonnance_id=ordonnance.id).order_by('ordre', 'created_at')
        ordonnance.medicaments = '\n'.join(ligne.texte for ligne in lignes)
        ordonnance.save(update_fields=['medicaments'])


class Migration(migrations.Migration):

    dependencies = [
        ('consultations', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Medicament',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom', models.CharField(max_length=120)),
                ('dosage', models.CharField(blank=True, default='', max_length=120)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['nom'],
            },
        ),
        migrations.CreateModel(
            name='LigneOrdonnance',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('texte', models.CharField(max_length=255)),
                ('statut', models.CharField(choices=[('EN_ATTENTE', 'En attente'), ('DONNEE', 'Donnee'), ('PHARMACIE', 'Pharmacie')], default='EN_ATTENTE', max_length=20)),
                ('ordre', models.PositiveIntegerField(editable=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('medicament', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lignes_ordonnance', to='consultations.medicament')),
                ('ordonnance', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lignes_ordonnance', to='consultations.ordonnance')),
            ],
            options={
                'ordering': ['ordre', 'created_at'],
                'constraints': [models.UniqueConstraint(fields=('ordonnance', 'ordre'), name='unique_ligne_ordonnance_order')],
            },
        ),
        migrations.RunPython(
            code=forwards_copy_medicaments_to_lines,
            reverse_code=backwards_copy_lines_to_medicaments,
        ),
        migrations.RemoveField(
            model_name='ordonnance',
            name='medicaments',
        ),
    ]
