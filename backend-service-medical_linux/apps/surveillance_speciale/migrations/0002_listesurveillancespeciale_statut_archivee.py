from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("surveillance_speciale", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="listesurveillancespeciale",
            name="statut",
            field=models.CharField(
                choices=[
                    ("BROUILLON", "Brouillon"),
                    ("SOUMISE", "Soumise"),
                    ("EN_TRAITEMENT", "En traitement"),
                    ("CLOTUREE", "Clôturée"),
                    ("ARCHIVEE", "Archivée"),
                ],
                default="BROUILLON",
                max_length=20,
            ),
        ),
    ]
