# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("medical_work", "0029_restore_ficheaptitude_vp_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="ficheaptitude",
            name="observations_complementaires",
            field=models.TextField(
                blank=True,
                null=True,
                verbose_name="Observations complémentaires",
            ),
        ),
    ]
