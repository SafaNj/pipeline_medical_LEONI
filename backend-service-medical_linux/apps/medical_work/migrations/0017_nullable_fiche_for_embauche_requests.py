from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("medical_work", "0016_collaborateur_nullable_fiche_aptitude"),
    ]

    operations = [
        migrations.AlterField(
            model_name="demandebilan",
            name="fiche_aptitude",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.CASCADE,
                related_name="demandes_bilan",
                to="medical_work.ficheaptitude",
                verbose_name="Fiche d'Aptitude",
            ),
        ),
        migrations.AlterField(
            model_name="demandeexamen",
            name="fiche_aptitude",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.CASCADE,
                related_name="demandes_examen",
                to="medical_work.ficheaptitude",
                verbose_name="Fiche d'Aptitude",
            ),
        ),
    ]
