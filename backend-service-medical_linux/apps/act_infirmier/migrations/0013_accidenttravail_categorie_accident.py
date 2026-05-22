from django.db import migrations, models


def remplir_categorie_depuis_type(apps, schema_editor):
    AccidentTravail = apps.get_model("act_infirmier", "AccidentTravail")
    for a in AccidentTravail.objects.all():
        t = (a.type_accident or "").lower()
        a.categorie_accident = "TRAJET" if "trajet" in t else "TRAVAIL"
        a.save(update_fields=["categorie_accident"])


class Migration(migrations.Migration):

    dependencies = [
        ("act_infirmier", "0012_enqueteaccident"),
    ]

    operations = [
        migrations.AddField(
            model_name="accidenttravail",
            name="categorie_accident",
            field=models.CharField(
                choices=[("TRAVAIL", "Accident de travail"), ("TRAJET", "Accident de trajet")],
                default="TRAVAIL",
                help_text="Travail ou trajet — utilisé pour les statistiques HSEE.",
                max_length=20,
                verbose_name="Catégorie",
            ),
        ),
        migrations.RunPython(remplir_categorie_depuis_type, migrations.RunPython.noop),
    ]
