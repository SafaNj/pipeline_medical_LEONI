from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('medical_work', '0027_ficheaptitude_champs_sousse'),
    ]

    operations = [
        migrations.AlterField(
            model_name='ficheaptitude',
            name='aptitude',
            field=models.CharField(
                choices=[
                    ('APTE_AU_POSTE', 'APTE_AU_POSTE'),
                    ('APTE_AMENAGEMENT_POSTE', 'APTE_AMENAGEMENT_POSTE'),
                    ('INAPTE_TEMPORAIRE', 'Inapte temporaire'),
                    ('INAPTE_DEFINITIF_MEME_POSTE', 'INAPTE_DEFINITIF_MEME_POSTE'),
                    ('INAPTE_DEFINITIF_ENTREPRISE', 'INAPTE_DEFINITIF_ENTREPRISE'),
                    ('aptitude', 'aptitude'),
                    ('reprise_mo_at', 'reprise_mo_at'),
                    ('aptitude_temporaire', 'aptitude_temporaire'),
                ],
                max_length=30,
                verbose_name='Aptitude',
            ),
        ),
    ]