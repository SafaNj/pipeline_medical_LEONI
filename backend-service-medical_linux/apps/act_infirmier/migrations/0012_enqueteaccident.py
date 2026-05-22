# Generated manually for EnqueteAccident

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("act_infirmier", "0011_alter_transferturgence_num_ordre"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="EnqueteAccident",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("telephone_victime", models.CharField(blank=True, max_length=20, verbose_name="Téléphone victime")),
                ("appartenance", models.CharField(blank=True, max_length=150, verbose_name="Appartenance (service / département)")),
                ("horaire_travail", models.CharField(blank=True, max_length=100, help_text='Ex. "06h–14h", journée complète', verbose_name="Horaire de travail")),
                ("circonstances", models.TextField(blank=True, verbose_name="Circonstances détaillées")),
                ("lieu_transport", models.CharField(blank=True, max_length=200, verbose_name="Lieu de transport de la victime")),
                ("temoins", models.JSONField(blank=True, default=list, verbose_name="Témoins")),
                ("date_redaction", models.DateTimeField(auto_now_add=True, verbose_name="Date de rédaction")),
                ("date_modification", models.DateTimeField(auto_now=True, verbose_name="Dernière modification")),
                (
                    "accident",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="enquete",
                        to="act_infirmier.accidenttravail",
                        verbose_name="Accident de travail",
                    ),
                ),
                (
                    "redige_par",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="enquetes_accident_redigees",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Rédigé par",
                    ),
                ),
            ],
            options={
                "verbose_name": "Enquête accident du travail",
                "verbose_name_plural": "Enquêtes accidents du travail",
                "db_table": "enquetes_accident",
            },
        ),
    ]
