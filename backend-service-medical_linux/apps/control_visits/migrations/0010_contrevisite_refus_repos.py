from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("control_visits", "0009_contrevisite_repos_initial_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="contrevisite",
            name="refus_repos",
            field=models.BooleanField(
                default=False,
                help_text="Si coché, comptabilisé en « contre-visite refus » (HSEE).",
                verbose_name="Refus de repos",
            ),
        ),
    ]
