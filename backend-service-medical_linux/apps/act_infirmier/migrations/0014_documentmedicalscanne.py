# Crée DocumentMedicalScanne avec le schéma final (SET_NULL, matricule_ref, PDF + images).
# (Ancienne 0015 fusionnée ici pour éviter un état intermédiaire obsolète sur base vide.)

import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("employees", "0009_remove_collaborateur_cin_and_more"),
        ("act_infirmier", "0013_accidenttravail_categorie_accident"),
    ]

    operations = [
        migrations.CreateModel(
            name="DocumentMedicalScanne",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "collaborateur",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="documents_scannes",
                        to="employees.collaborateur",
                        verbose_name="Collaborateur",
                    ),
                ),
                (
                    "matricule_ref",
                    models.CharField(
                        blank=True,
                        default="",
                        help_text="Obligatoire si pas de collaborateur (ex. candidat embauche non encore créé).",
                        max_length=50,
                        verbose_name="Matricule (candidat / référence)",
                    ),
                ),
                (
                    "type_document",
                    models.CharField(
                        choices=[
                            ("FICHE_MEDICALE", "Fiche médicale (scan)"),
                            ("DOSSIER_MEDICAL", "Dossier médical (scan)"),
                        ],
                        max_length=32,
                        verbose_name="Type de document",
                    ),
                ),
                (
                    "fichier",
                    models.FileField(
                        upload_to="act_infirmier/scans/%Y/%m/",
                        validators=[
                            django.core.validators.FileExtensionValidator(
                                ["pdf", "jpg", "jpeg", "png"]
                            )
                        ],
                        verbose_name="Fichier (PDF ou image)",
                    ),
                ),
                ("titre", models.CharField(blank=True, max_length=255, verbose_name="Titre / libellé")),
                ("commentaire", models.TextField(blank=True, verbose_name="Commentaire")),
                (
                    "date_document",
                    models.DateField(
                        blank=True,
                        help_text="Optionnel : date figurant sur le document scanné.",
                        null=True,
                        verbose_name="Date du document (papier)",
                    ),
                ),
                ("date_depot", models.DateTimeField(auto_now_add=True, verbose_name="Date de dépôt")),
                (
                    "depose_par",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="documents_medicaux_deposes",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Déposé par",
                    ),
                ),
            ],
            options={
                "verbose_name": "Document médical scanné",
                "verbose_name_plural": "Documents médicaux scannés",
                "ordering": ["-date_depot"],
            },
        ),
    ]
