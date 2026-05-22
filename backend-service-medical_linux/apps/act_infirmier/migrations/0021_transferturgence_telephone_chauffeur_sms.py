from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("act_infirmier", "0020_maladieprofessionnelle_is_tms"),
    ]

    operations = [
        migrations.AddField(
            model_name="transferturgence",
            name="telephone_chauffeur",
            field=models.CharField(
                blank=True,
                max_length=30,
                verbose_name="Téléphone du chauffeur (SMS)",
                help_text="Numéro pour notification SMS lors du transfert aux urgences.",
            ),
        ),
        migrations.AddField(
            model_name="transferturgence",
            name="sms_chauffeur_envoye",
            field=models.BooleanField(
                default=False,
                verbose_name="SMS chauffeur envoyé",
            ),
        ),
    ]
