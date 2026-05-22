from django.db import migrations, models


def _fallback_site(apps):
    Site = apps.get_model("account", "Site")
    return Site.objects.order_by("id").first()


def _site_from_user(user, fallback_site):
    if not user:
        return fallback_site
    profile = getattr(user, "profile", None)
    if not profile:
        return fallback_site
    infirmier = getattr(profile, "infirmier", None)
    site = getattr(infirmier, "site", None)
    return site or fallback_site


def _site_from_medecin(medecin, fallback_site):
    if not medecin:
        return fallback_site
    return getattr(medecin, "site", None) or fallback_site


def populate_sites(apps, schema_editor):
    fallback_site = _fallback_site(apps)
    if fallback_site is None:
        return

    AccidentTravail = apps.get_model("act_infirmier", "AccidentTravail")
    IncidentSansBon = apps.get_model("act_infirmier", "IncidentSansBon")
    IncidentAvecBon = apps.get_model("act_infirmier", "IncidentAvecBon")
    MaladieProfessionnelle = apps.get_model("act_infirmier", "MaladieProfessionnelle")
    MaladieChronique = apps.get_model("act_infirmier", "MaladieChronique")
    TransfertUrgence = apps.get_model("act_infirmier", "TransfertUrgence")
    DeclarationCNAM = apps.get_model("act_infirmier", "DeclarationCNAM")
    OrdreTransport = apps.get_model("act_infirmier", "OrdreTransport")
    AbsenceMedecin = apps.get_model("act_infirmier", "AbsenceMedecin")

    for obj in AccidentTravail.objects.select_related("infirmiere__profile__infirmier"):
        obj.site = _site_from_user(obj.infirmiere, fallback_site)
        obj.save(update_fields=["site"])

    for obj in IncidentSansBon.objects.select_related("infirmiere__profile__infirmier"):
        obj.site = _site_from_user(obj.infirmiere, fallback_site)
        obj.save(update_fields=["site"])

    for obj in IncidentAvecBon.objects.select_related("infirmiere__profile__infirmier"):
        obj.site = _site_from_user(obj.infirmiere, fallback_site)
        obj.save(update_fields=["site"])

    for obj in MaladieProfessionnelle.objects.select_related("infirmiere__profile__infirmier"):
        obj.site = _site_from_user(obj.infirmiere, fallback_site)
        obj.save(update_fields=["site"])

    for obj in MaladieChronique.objects.select_related("infirmiere__profile__infirmier"):
        obj.site = _site_from_user(obj.infirmiere, fallback_site)
        obj.save(update_fields=["site"])

    for obj in TransfertUrgence.objects.select_related("infirmiere__profile__infirmier"):
        obj.site = _site_from_user(obj.infirmiere, fallback_site)
        obj.save(update_fields=["site"])

    for obj in DeclarationCNAM.objects.select_related("infirmiere__profile__infirmier"):
        obj.site = _site_from_user(obj.infirmiere, fallback_site)
        obj.save(update_fields=["site"])

    for obj in OrdreTransport.objects.select_related("infirmier__profile__infirmier", "medecin"):
        obj.site = _site_from_user(obj.infirmier, fallback_site) or _site_from_medecin(obj.medecin, fallback_site)
        obj.save(update_fields=["site"])

    for obj in AbsenceMedecin.objects.select_related("medecin__site"):
        obj.site = _site_from_medecin(obj.medecin, fallback_site)
        obj.save(update_fields=["site"])


class Migration(migrations.Migration):
    dependencies = [
        ("account", "0012_medecin_nom_ar_medecin_prenom_ar"),
        ("act_infirmier", "0017_rendezvoussagefemme_motif_rdv"),
    ]

    operations = [
        migrations.AddField(
            model_name="accidenttravail",
            name="site",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name="accidents_travail",
                to="account.site",
            ),
        ),
        migrations.AddField(
            model_name="incidentsansbon",
            name="site",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name="incidents_sans_bon",
                to="account.site",
            ),
        ),
        migrations.AddField(
            model_name="incidentavecbon",
            name="site",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name="incidents_avec_bon",
                to="account.site",
            ),
        ),
        migrations.AddField(
            model_name="maladieprofessionnelle",
            name="site",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name="maladies_professionnelles",
                to="account.site",
            ),
        ),
        migrations.AddField(
            model_name="maladiechronique",
            name="site",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name="maladies_chroniques",
                to="account.site",
            ),
        ),
        migrations.AddField(
            model_name="transferturgence",
            name="site",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name="transferts_urgence",
                to="account.site",
            ),
        ),
        migrations.AddField(
            model_name="declarationcnam",
            name="site",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name="declarations_cnam",
                to="account.site",
            ),
        ),
        migrations.AddField(
            model_name="ordretransport",
            name="site",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name="ordres_transport",
                to="account.site",
                verbose_name="Site",
            ),
        ),
        migrations.AddField(
            model_name="absencemedecin",
            name="site",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name="absences_medecins",
                to="account.site",
            ),
        ),
        migrations.RunPython(populate_sites, migrations.RunPython.noop),
    ]
