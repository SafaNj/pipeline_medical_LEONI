from django.db import migrations, models


def normaliser_ordre_lignes_cv(apps, schema_editor):
    """Attribue 1..n à chaque liste (tri ordre puis pk), élimine trous et doublons avant contrainte unique."""
    Liste = apps.get_model("control_visits", "ListeContreVisite")
    Ligne = apps.get_model("control_visits", "LigneContreVisite")
    for liste in Liste.objects.all():
        lignes = list(Ligne.objects.filter(liste=liste).order_by("ordre", "pk"))
        for i, ligne in enumerate(lignes, start=1):
            if ligne.ordre != i:
                ligne.ordre = i
                ligne.save(update_fields=["ordre"])


class Migration(migrations.Migration):

    dependencies = [
        ("control_visits", "0013_listecontrevisite_sms_veille_ligne_sms_jour_j"),
    ]

    operations = [
        migrations.RunPython(normaliser_ordre_lignes_cv, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="lignecontrevisite",
            name="ordre",
            field=models.PositiveIntegerField(
                verbose_name="Ordre dans la liste",
                help_text="Rang pour la file d’attente (SMS, médecin). Unique par liste.",
            ),
        ),
        migrations.AddConstraint(
            model_name="lignecontrevisite",
            constraint=models.UniqueConstraint(
                fields=("liste", "ordre"),
                name="uniq_ligne_cv_ordre_par_liste",
            ),
        ),
    ]
