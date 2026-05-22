from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('embauche', '0008_alter_listeembauche_statut_archivee'),
    ]

    operations = [
        migrations.AddField(
            model_name='candidatembauche',
            name='numero_cnss',
            field=models.CharField(blank=True, max_length=50, verbose_name='N° CNSS'),
        ),
    ]
