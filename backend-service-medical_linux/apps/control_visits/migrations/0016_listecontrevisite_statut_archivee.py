# Generated manually — statut ARCHIVEE (listes contre-visite).

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("control_visits", "0015_alter_lignecontrevisite_options_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="listecontrevisite",
            name="statut",
            field=models.CharField(
                choices=[
                    ("BROUILLON", "Brouillon"),
                    ("SOUMISE", "Soumise"),
                    ("EN_TRAITEMENT", "En traitement"),
                    ("CLOTUREE", "Cloturee"),
                    ("ARCHIVEE", "Archivée"),
                ],
                default="BROUILLON",
                max_length=20,
            ),
        ),
    ]
