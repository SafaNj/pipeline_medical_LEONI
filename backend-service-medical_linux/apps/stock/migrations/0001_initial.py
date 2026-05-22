import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('employees', '0005_collaborateur_numero_cnss'),
        ('consultations', '0002_ligne_ordonnance'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
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
            name='StockMedicament',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantite', models.PositiveIntegerField(default=0)),
                ('seuil_alerte', models.PositiveIntegerField(default=10)),
                ('date_expiration', models.DateField(blank=True, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('medicament', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='stocks', to='stock.medicament')),
            ],
            options={
                'ordering': ['medicament__nom'],
                'constraints': [models.UniqueConstraint(fields=('medicament',), name='unique_stock_per_medicament')],
            },
        ),
        migrations.CreateModel(
            name='ActeInfirmier',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantite', models.PositiveIntegerField()),
                ('motif', models.TextField(blank=True, null=True)),
                ('date_acte', models.DateTimeField(auto_now_add=True)),
                ('collaborateur', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='actes_infirmiers', to='employees.collaborateur')),
                ('infirmiere', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='actes_infirmiers_realises', to=settings.AUTH_USER_MODEL)),
                ('ligne_ordonnance', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='actes_infirmiers', to='consultations.ligneordonnance')),
                ('medicament', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='actes_infirmiers', to='stock.medicament')),
            ],
            options={
                'ordering': ['-date_acte'],
            },
        ),
    ]
