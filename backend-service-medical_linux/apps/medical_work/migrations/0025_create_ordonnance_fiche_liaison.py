from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("medical_work", "0024_add_sousse_fields_bilan_examen"),
    ]

    operations = [
        migrations.CreateModel(
            name="Ordonnance",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("date_ordonnance", models.DateField(verbose_name="Date ordonnance")),
                ("prescription", models.TextField(blank=True, default="", verbose_name="Prescription")),
                ("date_creation", models.DateTimeField(auto_now_add=True)),
                (
                    "fiche_aptitude",
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name="ordonnances",
                        to="medical_work.ficheaptitude",
                        verbose_name="Fiche d'Aptitude",
                    ),
                ),
            ],
            options={
                "verbose_name": "Ordonnance",
                "verbose_name_plural": "Ordonnances",
                "db_table": "ordonnances",
                "ordering": ["-date_ordonnance", "-id"],
            },
        ),
        migrations.CreateModel(
            name="FicheLiaison",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("date_liaison", models.DateField(verbose_name="Date liaison")),
                ("nom_patient", models.CharField(blank=True, default="", max_length=255, verbose_name="Nom patient")),
                ("age_patient", models.IntegerField(blank=True, null=True, verbose_name="Age patient")),
                ("employeur", models.CharField(blank=True, default="", max_length=255, verbose_name="Employeur")),
                ("matricule", models.CharField(blank=True, default="", max_length=50, verbose_name="Matricule")),
                ("message", models.TextField(blank=True, default="", verbose_name="Message")),
                ("date_creation", models.DateTimeField(auto_now_add=True)),
                (
                    "fiche_aptitude",
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name="fiches_liaison",
                        to="medical_work.ficheaptitude",
                        verbose_name="Fiche d'Aptitude",
                    ),
                ),
            ],
            options={
                "verbose_name": "Fiche de Liaison",
                "verbose_name_plural": "Fiches de Liaison",
                "db_table": "fiches_liaison",
                "ordering": ["-date_liaison", "-id"],
            },
        ),
    ]
