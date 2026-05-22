from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('embauche', '0007_alter_listeembauche_date_visite'),
    ]

    operations = [
        migrations.AlterField(
            model_name='listeembauche',
            name='statut',
            field=models.CharField(
                choices=[
                    ('BROUILLON', 'Brouillon'),
                    ('SOUMISE', 'Soumise'),
                    ('EN_TRAITEMENT', 'En traitement'),
                    ('CLOTUREE', 'Cloturee'),
                    ('ARCHIVEE', 'Archivee'),
                ],
                default='BROUILLON',
                max_length=20,
            ),
        ),
    ]
