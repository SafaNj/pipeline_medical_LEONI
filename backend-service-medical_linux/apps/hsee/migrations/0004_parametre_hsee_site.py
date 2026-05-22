from django.db import migrations, models


def _fallback_site(apps):
    Site = apps.get_model("account", "Site")
    return Site.objects.order_by("id").first()


def populate_sites(apps, schema_editor):
    fallback_site = _fallback_site(apps)
    if fallback_site is None:
        return

    ParametreHSEEMensuel = apps.get_model("hsee", "ParametreHSEEMensuel")
    for param in ParametreHSEEMensuel.objects.all():
        param.site = fallback_site
        param.save(update_fields=["site"])


class Migration(migrations.Migration):
    dependencies = [
        ("account", "0012_medecin_nom_ar_medecin_prenom_ar"),
        ("hsee", "0003_notificationhsse"),
    ]

    operations = [
        migrations.AddField(
            model_name="parametrehseemensuel",
            name="site",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name="parametres_hsee_mensuels",
                to="account.site",
            ),
        ),
        migrations.RemoveConstraint(
            model_name="parametrehseemensuel",
            name="uniq_parametre_hsee_annee_mois",
        ),
        migrations.AddConstraint(
            model_name="parametrehseemensuel",
            constraint=models.UniqueConstraint(
                fields=("annee", "mois", "site"),
                name="uniq_parametre_hsee_annee_mois_site",
            ),
        ),
        migrations.RunPython(populate_sites, migrations.RunPython.noop),
    ]
