# Generated manually

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("account", "0004_medecin_heures_par_defaut"),
        ("employees", "0009_remove_collaborateur_cin_and_more"),
        ("medical_work", "0021_remarqueinfirmier"),
    ]

    operations = [
        migrations.CreateModel(
            name="ListeVisitePeriodique",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("reference", models.CharField(editable=False, max_length=20, unique=True)),
                ("date_visite", models.DateField(blank=True, null=True)),
                (
                    "statut",
                    models.CharField(
                        choices=[
                            ("BROUILLON", "Brouillon"),
                            ("SOUMISE", "Soumise"),
                            ("EN_TRAITEMENT", "En traitement"),
                            ("CLOTUREE", "Clôturée"),
                            ("ARCHIVEE", "Archivée"),
                        ],
                        default="BROUILLON",
                        max_length=20,
                    ),
                ),
                ("date_creation", models.DateTimeField(auto_now_add=True)),
                ("date_modification", models.DateTimeField(auto_now=True)),
                (
                    "cree_par",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="listes_visite_periodique_creees",
                        to="account.profile",
                    ),
                ),
                (
                    "medecin",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="listes_visite_periodique_assignees",
                        to="account.medecin",
                    ),
                ),
            ],
            options={
                "verbose_name": "Liste visite périodique",
                "verbose_name_plural": "Listes visites périodiques",
                "db_table": "listes_visite_periodique",
                "ordering": ["-date_creation"],
            },
        ),
        migrations.CreateModel(
            name="LigneVisitePeriodique",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "presence",
                    models.CharField(
                        choices=[
                            ("NON_RENSEIGNEE", "Non renseignée"),
                            ("PRESENT", "Présent"),
                            ("ABSENT", "Absent"),
                        ],
                        default="NON_RENSEIGNEE",
                        max_length=20,
                    ),
                ),
                (
                    "collaborateur",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="lignes_visite_periodique",
                        to="employees.collaborateur",
                    ),
                ),
                (
                    "fiche_aptitude",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="lignes_visite_periodique",
                        to="medical_work.ficheaptitude",
                    ),
                ),
                (
                    "liste",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="lignes",
                        to="visites_periodiques.listevisiteperiodique",
                    ),
                ),
            ],
            options={
                "verbose_name": "Ligne visite périodique",
                "verbose_name_plural": "Lignes visites périodiques",
                "db_table": "lignes_visite_periodique",
                "ordering": ["id"],
            },
        ),
        migrations.AddConstraint(
            model_name="lignevisiteperiodique",
            constraint=models.UniqueConstraint(
                fields=("liste", "collaborateur"),
                name="uniq_liste_vp_collaborateur",
            ),
        ),
    ]
