import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="ParametreHSEEMensuel",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("annee", models.PositiveIntegerField()),
                (
                    "mois",
                    models.PositiveIntegerField(
                        validators=[
                            django.core.validators.MinValueValidator(1),
                            django.core.validators.MaxValueValidator(12),
                        ]
                    ),
                ),
                (
                    "heures_travaillees",
                    models.PositiveBigIntegerField(
                        default=0,
                        help_text="Heures travaillées totales (entreprise) sur le mois — dénominateur des ratios × 200 000.",
                    ),
                ),
                (
                    "effectif_travailleurs",
                    models.PositiveIntegerField(
                        blank=True,
                        help_text="Effectif pour le ratio maladies professionnelles × 1000 (optionnel).",
                        null=True,
                    ),
                ),
            ],
            options={
                "verbose_name": "Paramètre HSEE mensuel",
                "verbose_name_plural": "Paramètres HSEE mensuels",
                "ordering": ("-annee", "-mois"),
            },
        ),
        migrations.CreateModel(
            name="EquipementMedicalEndommage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("date_constat", models.DateField()),
                ("description", models.CharField(blank=True, max_length=255)),
                ("date_creation", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name": "Équipement médical endommagé",
                "verbose_name_plural": "Équipements médicaux endommagés",
                "ordering": ("-date_constat",),
            },
        ),
        migrations.AddConstraint(
            model_name="parametrehseemensuel",
            constraint=models.UniqueConstraint(fields=("annee", "mois"), name="uniq_parametre_hsee_annee_mois"),
        ),
    ]
