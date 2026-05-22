import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("account", "0014_site_entreprise_fields"),
        ("employees", "0009_remove_collaborateur_cin_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="ListeSurveillanceSpeciale",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("reference", models.CharField(editable=False, max_length=20, unique=True)),
                ("date_visite", models.DateField(blank=True, null=True)),
                ("statut", models.CharField(choices=[("BROUILLON", "Brouillon"), ("SOUMISE", "Soumise"), ("EN_TRAITEMENT", "En traitement"), ("CLOTUREE", "Clôturée")], default="BROUILLON", max_length=20)),
                ("titre", models.CharField(blank=True, help_text="Libellé libre (ex. campagne, motif).", max_length=200, verbose_name="Intitulé")),
                ("date_creation", models.DateTimeField(auto_now_add=True)),
                ("date_modification", models.DateTimeField(auto_now=True)),
                ("sms_veille_envoye", models.BooleanField(default=False, verbose_name="SMS rappel veille (J-1) envoyé")),
                ("cree_par", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="listes_surveillance_speciale_creees", to="account.profile")),
                ("medecin", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="listes_surveillance_speciale_assignees", to="account.medecin", verbose_name="Médecin du travail")),
                ("site", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="listes_surveillance_speciale", to="account.site")),
            ],
            options={
                "verbose_name": "Liste surveillance médicale spéciale",
                "verbose_name_plural": "Listes surveillance médicale spéciale",
                "db_table": "listes_surveillance_speciale",
                "ordering": ["-date_creation"],
            },
        ),
        migrations.CreateModel(
            name="LigneSurveillanceSpeciale",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("ordre", models.PositiveIntegerField(help_text="Rang pour la file d'attente (SMS). Unique par liste.", verbose_name="Ordre dans la liste")),
                ("presence", models.CharField(choices=[("EN_ATTENTE", "En attente"), ("PRESENT", "Présent"), ("ABSENT", "Absent"), ("REPORTE", "Reporté")], default="EN_ATTENTE", max_length=20)),
                ("raison_report", models.TextField(blank=True)),
                ("traitement_termine", models.BooleanField(default=False)),
                ("remarque_medecin", models.TextField(blank=True)),
                ("sms_jour_j_envoye", models.BooleanField(default=False, verbose_name="SMS jour J (file) envoyé")),
                ("collaborateur", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="lignes_surveillance_speciale", to="employees.collaborateur")),
                ("liste", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="lignes", to="surveillance_speciale.listesurveillancespeciale")),
            ],
            options={
                "verbose_name": "Ligne surveillance médicale spéciale",
                "verbose_name_plural": "Lignes surveillance médicale spéciale",
                "db_table": "lignes_surveillance_speciale",
                "ordering": ["ordre", "pk"],
            },
        ),
        migrations.AddConstraint(
            model_name="lignesurveillancespeciale",
            constraint=models.UniqueConstraint(fields=("liste", "ordre"), name="uniq_ligne_ss_ordre_par_liste"),
        ),
        migrations.AddConstraint(
            model_name="lignesurveillancespeciale",
            constraint=models.UniqueConstraint(fields=("liste", "collaborateur"), name="uniq_ligne_ss_collaborateur_par_liste"),
        ),
    ]
