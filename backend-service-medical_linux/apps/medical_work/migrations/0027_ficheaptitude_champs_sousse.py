from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("medical_work", "0026_ficheaptitude_sousse_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="ficheaptitude",
            name="duree_aptitude",
            field=models.CharField(
                blank=True,
                default="",
                max_length=255,
                verbose_name="Et ce pour une durée de",
            ),
        ),
        migrations.AlterField(
            model_name="ficheaptitude",
            name="periode_temporaire",
            field=models.CharField(
                blank=True,
                default="",
                max_length=255,
                verbose_name="Pour une période de",
            ),
        ),
        migrations.AlterField(
            model_name="ficheaptitude",
            name="date_reprise",
            field=models.DateField(
                blank=True,
                null=True,
                verbose_name="Peut reprendre son travail à dater du",
            ),
        ),
    ]
