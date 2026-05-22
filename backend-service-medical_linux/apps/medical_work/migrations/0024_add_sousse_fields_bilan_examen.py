from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("medical_work", "0023_ficheaptitude_site"),
    ]

    operations = [
        migrations.AddField(
            model_name="demandebilan",
            name="anemie",
            field=models.BooleanField(blank=True, default=False, verbose_name="Anémie"),
        ),
        migrations.AddField(
            model_name="demandebilan",
            name="anticoagulants",
            field=models.CharField(
                blank=True,
                choices=[("", ""), ("OUI", "Oui"), ("NON", "Non")],
                default="",
                max_length=3,
                verbose_name="Anticoagulants",
            ),
        ),
        migrations.AddField(
            model_name="demandebilan",
            name="autre_atcd",
            field=models.CharField(blank=True, default="", max_length=255, verbose_name="Autres ATCD"),
        ),
        migrations.AddField(
            model_name="demandebilan",
            name="autres_risques",
            field=models.BooleanField(blank=True, default=False, verbose_name="Autres risques"),
        ),
        migrations.AddField(
            model_name="demandebilan",
            name="chauffeur",
            field=models.BooleanField(blank=True, default=False, verbose_name="Risque chauffeur"),
        ),
        migrations.AddField(
            model_name="demandebilan",
            name="chimique",
            field=models.BooleanField(blank=True, default=False, verbose_name="Risque chimique"),
        ),
        migrations.AddField(
            model_name="demandebilan",
            name="depistage",
            field=models.BooleanField(blank=True, default=False, verbose_name="Dépistage"),
        ),
        migrations.AddField(
            model_name="demandebilan",
            name="diabete",
            field=models.BooleanField(blank=True, default=False, verbose_name="Diabète"),
        ),
        migrations.AddField(
            model_name="demandebilan",
            name="dyslipidemie",
            field=models.BooleanField(blank=True, default=False, verbose_name="Dyslipidémie"),
        ),
        migrations.AddField(
            model_name="demandebilan",
            name="goutte",
            field=models.BooleanField(blank=True, default=False, verbose_name="Goutte"),
        ),
        migrations.AddField(
            model_name="demandebilan",
            name="hepatite",
            field=models.BooleanField(blank=True, default=False, verbose_name="Hépatite"),
        ),
        migrations.AddField(
            model_name="demandebilan",
            name="hta",
            field=models.BooleanField(blank=True, default=False, verbose_name="HTA"),
        ),
        migrations.AddField(
            model_name="demandebilan",
            name="infectieux",
            field=models.BooleanField(blank=True, default=False, verbose_name="Risque infectieux"),
        ),
        migrations.AddField(
            model_name="demandebilan",
            name="ldl_hdl_cholesterol",
            field=models.BooleanField(blank=True, default=False, verbose_name="LDL / HDL / Cholestérol"),
        ),
        migrations.AddField(
            model_name="demandebilan",
            name="suivi_pathologies_chroniques",
            field=models.BooleanField(blank=True, default=False, verbose_name="Suivi pathologies chroniques"),
        ),
        migrations.AddField(
            model_name="demandebilan",
            name="travail_poste_nuit",
            field=models.BooleanField(blank=True, default=False, verbose_name="Travail de nuit / poste"),
        ),
        migrations.AddField(
            model_name="demandeexamen",
            name="microfilm",
            field=models.BooleanField(blank=True, default=False, verbose_name="Microfilm"),
        ),
        migrations.AddField(
            model_name="demandeexamen",
            name="risque_chauffeur",
            field=models.BooleanField(blank=True, default=False, verbose_name="Risque chauffeur"),
        ),
        migrations.AddField(
            model_name="demandeexamen",
            name="risque_chimique",
            field=models.BooleanField(blank=True, default=False, verbose_name="Risque chimique"),
        ),
        migrations.AddField(
            model_name="demandeexamen",
            name="risque_infectieux",
            field=models.BooleanField(blank=True, default=False, verbose_name="Risque infectieux"),
        ),
        migrations.AddField(
            model_name="demandeexamen",
            name="risque_physique",
            field=models.BooleanField(blank=True, default=False, verbose_name="Risque physique"),
        ),
        migrations.AddField(
            model_name="demandeexamen",
            name="spirometrie",
            field=models.BooleanField(blank=True, default=False, verbose_name="Spirométrie"),
        ),
    ]
