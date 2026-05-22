from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("medical_work", "0020_ficheaptitude_numero_cnss_salarie"),
        ("account", "0004_medecin_heures_par_defaut"),
    ]

    operations = [
        migrations.CreateModel(
            name="RemarqueInfirmier",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "fiche_aptitude",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="remarque_infirmier",
                        to="medical_work.ficheaptitude",
                        verbose_name="Fiche d'aptitude",
                    ),
                ),
                (
                    "infirmier",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="remarques_infirmier",
                        to="account.profile",
                        verbose_name="Infirmier",
                    ),
                ),
                ("remarque", models.TextField(blank=True, verbose_name="Remarque infirmier")),
                ("reevaluation", models.TextField(blank=True, verbose_name="Ré-évaluation infirmier")),
                ("date_creation", models.DateTimeField(auto_now_add=True)),
                ("date_modification", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Remarque infirmier",
                "verbose_name_plural": "Remarques infirmier",
                "db_table": "remarques_infirmier",
            },
        ),
    ]
