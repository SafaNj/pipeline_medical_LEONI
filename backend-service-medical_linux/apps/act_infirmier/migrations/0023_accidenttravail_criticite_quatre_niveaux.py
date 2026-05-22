# Criticité : 4 niveaux (FAIBLE, MODEREE, GRAVE, TRES_GRAVE).
# Données existantes : MOYEN -> MODEREE, ELEVE -> GRAVE.

from django.db import migrations, models


def _remapper_criticite(apps, schema_editor):
    AccidentTravail = apps.get_model("act_infirmier", "AccidentTravail")
    AccidentTravail.objects.filter(criticite="MOYEN").update(criticite="MODEREE")
    AccidentTravail.objects.filter(criticite="ELEVE").update(criticite="GRAVE")


def _remapper_criticite_inverse(apps, schema_editor):
    AccidentTravail = apps.get_model("act_infirmier", "AccidentTravail")
    AccidentTravail.objects.filter(criticite="MODEREE").update(criticite="MOYEN")
    AccidentTravail.objects.filter(criticite="GRAVE").update(criticite="ELEVE")
    AccidentTravail.objects.filter(criticite="TRES_GRAVE").update(criticite="ELEVE")


class Migration(migrations.Migration):

    dependencies = [
        ("act_infirmier", "0022_criticite_choices"),
    ]

    operations = [
        migrations.RunPython(_remapper_criticite, _remapper_criticite_inverse),
        migrations.AlterField(
            model_name="accidenttravail",
            name="criticite",
            field=models.CharField(
                blank=True,
                choices=[
                    ("FAIBLE", "Faible"),
                    ("MODEREE", "Modérée"),
                    ("GRAVE", "Grave"),
                    ("TRES_GRAVE", "Très grave"),
                ],
                max_length=20,
                verbose_name="Criticité",
            ),
        ),
    ]
