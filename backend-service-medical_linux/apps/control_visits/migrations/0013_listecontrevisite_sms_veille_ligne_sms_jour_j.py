from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("control_visits", "0012_listecontrevisite_lignecontrevisite"),
    ]

    operations = [
        migrations.AddField(
            model_name="listecontrevisite",
            name="sms_veille_envoye",
            field=models.BooleanField(
                default=False,
                verbose_name="SMS rappel veille (J-1) envoyé",
            ),
        ),
        migrations.AddField(
            model_name="lignecontrevisite",
            name="sms_jour_j_envoye",
            field=models.BooleanField(
                default=False,
                verbose_name="SMS jour J (tour / file) envoyé",
            ),
        ),
    ]
