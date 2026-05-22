from django.db import migrations, models


def populate_medicament_site(apps, schema_editor):
    Site = apps.get_model("account", "Site")
    Medicament = apps.get_model("stock", "Medicament")
    StockMedicament = apps.get_model("stock", "StockMedicament")

    fallback_site = Site.objects.order_by("id").first()

    for medicament in Medicament.objects.all():
        site = (
            StockMedicament.objects.filter(medicament_id=medicament.id, site__isnull=False)
            .order_by("id")
            .values_list("site_id", flat=True)
            .first()
        )
        medicament.site_id = site or fallback_site.id if fallback_site else None
        medicament.save(update_fields=["site"])


class Migration(migrations.Migration):
    dependencies = [
        ("account", "0012_medecin_nom_ar_medecin_prenom_ar"),
        ("stock", "0010_add_stock_site"),
    ]

    operations = [
        migrations.AddField(
            model_name="medicament",
            name="site",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name="medicaments",
                to="account.site",
            ),
        ),
        migrations.RunPython(populate_medicament_site, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="medicament",
            name="site",
            field=models.ForeignKey(
                on_delete=models.deletion.PROTECT,
                related_name="medicaments",
                to="account.site",
            ),
        ),
    ]