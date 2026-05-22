import django.db.models.deletion
from django.db import migrations, models


def _fallback_site(apps):
    Site = apps.get_model("account", "Site")
    return Site.objects.order_by("id").first()


def _site_from_infirmiere(apps, user_id, fallback_site):
    if not user_id:
        return fallback_site

    Profile = apps.get_model("account", "Profile")
    profile = (
        Profile.objects
        .select_related("infirmier__site")
        .filter(user_id=user_id)
        .first()
    )
    if not profile:
        return fallback_site

    infirmier = getattr(profile, "infirmier", None)
    site = getattr(infirmier, "site", None)
    return site or fallback_site


def populate_rdv_sites(apps, schema_editor):
    fallback_site = _fallback_site(apps)
    if fallback_site is None:
        return

    RendezVousPsychologue = apps.get_model("act_infirmier", "RendezVousPsychologue")
    RendezVousSagefemme = apps.get_model("act_infirmier", "RendezVousSagefemme")

    for obj in RendezVousPsychologue.objects.filter(site__isnull=True):
        obj.site = _site_from_infirmiere(apps, obj.infirmiere_id, fallback_site)
        obj.save(update_fields=["site"])

    for obj in RendezVousSagefemme.objects.filter(site__isnull=True):
        obj.site = _site_from_infirmiere(apps, obj.infirmiere_id, fallback_site)
        obj.save(update_fields=["site"])


class Migration(migrations.Migration):

    dependencies = [
        ('account', '0012_medecin_nom_ar_medecin_prenom_ar'),
        ('act_infirmier', '0018_add_site_fields'),
    ]

    operations = [
        migrations.RenameField(
            model_name='rendezvouspsychologue',
            old_name='site',
            new_name='secteur_collaborateur',
        ),
        migrations.RenameField(
            model_name='rendezvoussagefemme',
            old_name='site',
            new_name='secteur_collaborateur',
        ),
        migrations.AlterField(
            model_name='rendezvouspsychologue',
            name='secteur_collaborateur',
            field=models.CharField(blank=True, max_length=150, verbose_name='Secteur collaborateur'),
        ),
        migrations.AlterField(
            model_name='rendezvoussagefemme',
            name='secteur_collaborateur',
            field=models.CharField(blank=True, max_length=150, verbose_name='Secteur collaborateur'),
        ),
        migrations.AddField(
            model_name='rendezvouspsychologue',
            name='site',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='rdv_psychologue_entries', to='account.site'),
        ),
        migrations.AddField(
            model_name='rendezvoussagefemme',
            name='site',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='rdv_sagefemme_entries', to='account.site'),
        ),
        migrations.RunPython(populate_rdv_sites, migrations.RunPython.noop),
    ]
