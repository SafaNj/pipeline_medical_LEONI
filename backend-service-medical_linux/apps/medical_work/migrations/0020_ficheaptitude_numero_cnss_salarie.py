from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("medical_work", "0019_merge_20260327_2327"),
    ]

    operations = [
        migrations.AddField(
            model_name="ficheaptitude",
            name="numero_cnss",
            field=models.CharField(
                blank=True,
                max_length=50,
                verbose_name="Numéro CNSS (salarié)",
            ),
        ),
    ]
