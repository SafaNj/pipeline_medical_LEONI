# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("visites_periodiques", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="listevisiteperiodique",
            name="sms_veille_envoye",
            field=models.BooleanField(
                default=False,
                verbose_name="SMS rappel veille (J-1) envoyé",
            ),
        ),
        migrations.AddField(
            model_name="lignevisiteperiodique",
            name="sms_jour_j_envoye",
            field=models.BooleanField(
                default=False,
                verbose_name="SMS jour J (file) envoyé",
            ),
        ),
    ]
