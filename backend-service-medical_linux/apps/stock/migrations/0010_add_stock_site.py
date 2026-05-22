from django.db import migrations, models


def _fallback_site(apps):
    Site = apps.get_model("account", "Site")
    return Site.objects.order_by("id").first()


def populate_sites(apps, schema_editor):
    fallback_site = _fallback_site(apps)
    if fallback_site is None:
        return

    StockMedicament = apps.get_model("stock", "StockMedicament")
    MouvementStock = apps.get_model("stock", "MouvementStock")

    for stock in StockMedicament.objects.all():
        site = None
        mouvement = (
            MouvementStock.objects.select_related("utilisateur__profile__infirmier")
            .filter(stock_id=stock.pk)
            .order_by("-date_mouvement", "-id")
            .first()
        )
        if mouvement and mouvement.utilisateur:
            profile = getattr(mouvement.utilisateur, "profile", None)
            infirmier = getattr(profile, "infirmier", None) if profile else None
            site = getattr(infirmier, "site", None)
        stock.site = site or fallback_site
        stock.save(update_fields=["site"])


class Migration(migrations.Migration):
    dependencies = [
        ("account", "0012_medecin_nom_ar_medecin_prenom_ar"),
        ("stock", "0009_medicament_unite_autre"),
    ]

    operations = [
        migrations.AddField(
            model_name="stockmedicament",
            name="site",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name="stocks_medicaments",
                to="account.site",
            ),
        ),
        migrations.RemoveConstraint(
            model_name="stockmedicament",
            name="unique_stock_per_medicament",
        ),
        migrations.AddConstraint(
            model_name="stockmedicament",
            constraint=models.UniqueConstraint(
                fields=("site", "medicament"),
                name="unique_stock_per_site_medicament",
            ),
        ),
        migrations.RunPython(populate_sites, migrations.RunPython.noop),
    ]
