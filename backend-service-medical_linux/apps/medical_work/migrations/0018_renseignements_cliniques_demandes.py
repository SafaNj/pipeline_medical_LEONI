from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('medical_work', '0017_nullable_fiche_for_embauche_requests'),
    ]

    operations = [
        migrations.AddField(
            model_name='demandeexamen',
            name='renseignements_cliniques',
            field=models.TextField(blank=True, default='', verbose_name='Renseignements cliniques'),
        ),
        migrations.AddField(
            model_name='demandebilan',
            name='renseignements_cliniques',
            field=models.TextField(blank=True, default='', verbose_name='Renseignements cliniques'),
        ),
    ]
