# Generated manually — unite « autre » + libellé personnalisé

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('stock', '0008_alter_medicament_conditionnement_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='medicament',
            name='unite_personnalise',
            field=models.CharField(
                blank=True,
                default='',
                help_text="Libelle si unite='autre' (ex: goutte, dose, puff)",
                max_length=60,
                verbose_name='Unite personnalisee',
            ),
        ),
        migrations.AlterField(
            model_name='medicament',
            name='unite',
            field=models.CharField(
                choices=[
                    ('comprime', 'Comprime'),
                    ('ampoule', 'Ampoule'),
                    ('millilitre', 'Millilitre'),
                    ('sachet', 'Sachet'),
                    ('gelule', 'Gelule'),
                    ('suppositoire', 'Suppositoire'),
                    ('patch', 'Patch'),
                    ('unite', 'Unite'),
                    ('autre', 'Autre'),
                ],
                default='comprime',
                help_text='Unite dans laquelle on donne au patient (comprime, ampoule...)',
                max_length=20,
                verbose_name='Unite de dispensation',
            ),
        ),
    ]
