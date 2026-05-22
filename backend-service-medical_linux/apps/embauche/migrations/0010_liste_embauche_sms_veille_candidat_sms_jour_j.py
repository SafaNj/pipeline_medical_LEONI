from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("embauche", "0009_candidatembauche_numero_cnss"),
    ]

    operations = [
        migrations.AddField(
            model_name="listeembauche",
            name="sms_veille_envoye",
            field=models.BooleanField(
                default=False,
                verbose_name="SMS rappel veille (J-1) envoyé",
            ),
        ),
        migrations.AddField(
            model_name="candidatembauche",
            name="sms_jour_j_envoye",
            field=models.BooleanField(
                default=False,
                verbose_name="SMS jour J (file) envoyé",
            ),
        ),
    ]
