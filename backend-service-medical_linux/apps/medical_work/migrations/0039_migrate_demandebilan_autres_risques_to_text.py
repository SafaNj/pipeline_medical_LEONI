from django.db import migrations, models


def copy_autres_risques_bool_to_text(apps, schema_editor):
    DemandeBilan = apps.get_model("medical_work", "DemandeBilan")
    for row in DemandeBilan.objects.all().only("id", "autres_risques", "autres_risques_text"):
        val = getattr(row, "autres_risques", False)
        row.autres_risques_text = "OUI" if val is True else ""
        row.save(update_fields=["autres_risques_text"])


class Migration(migrations.Migration):

    dependencies = [
        ("medical_work", "0038_certificataptitudemateur_entete_certificat_medical_aptitude_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="demandebilan",
            name="autres_risques_text",
            field=models.CharField(
                max_length=255,
                blank=True,
                default="",
                verbose_name="Autres risques",
            ),
        ),
        migrations.RunPython(copy_autres_risques_bool_to_text, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="demandebilan",
            name="autres_risques",
        ),
        migrations.RenameField(
            model_name="demandebilan",
            old_name="autres_risques_text",
            new_name="autres_risques",
        ),
    ]

