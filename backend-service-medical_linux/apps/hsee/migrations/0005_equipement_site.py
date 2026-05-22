from django.db import migrations, models


def _fallback_site(apps):
    Site = apps.get_model("account", "Site")
    return Site.objects.order_by("id").first()


def populate_sites(apps, schema_editor):
    fallback_site = _fallback_site(apps)
    if fallback_site is None:
        return

    EquipementMedicalEndommage = apps.get_model("hsee", "EquipementMedicalEndommage")
    for equipement in EquipementMedicalEndommage.objects.filter(site__isnull=True):
        equipement.site = fallback_site
        equipement.save(update_fields=["site"])


class Migration(migrations.Migration):
    dependencies = [
        ("account", "0012_medecin_nom_ar_medecin_prenom_ar"),
        ("hsee", "0004_parametre_hsee_site"),
    ]

    operations = [
        migrations.AddField(
            model_name="equipementmedicalendommage",
            name="site",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name="equipements_medicaux_endommages",
                to="account.site",
            ),
        ),
        migrations.RunPython(populate_sites, migrations.RunPython.noop),
    ]
