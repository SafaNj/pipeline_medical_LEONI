import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("medical_work", "0021_remarqueinfirmier"),
        ("visites_periodiques", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="ficheaptitude",
            name="ligne_visite_periodique",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to="visites_periodiques.lignevisiteperiodique",
                verbose_name="Ligne visite périodique",
            ),
        ),
    ]
