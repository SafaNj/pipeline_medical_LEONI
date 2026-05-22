from django.db import migrations


def update_site_details(apps, schema_editor):
    Site = apps.get_model('account', 'Site')

    updates = [
        {
            'code': 'MENZEL_HAYET',
            'nom': 'Leoni Menzel Hayet',
            'nom_ar': 'ليوني منزل حياة',
            'adresse': 'Zone Industrielle, Menzel Hayet',
            'telephone': '+216 73 123 456',
        },
        {
            'code': 'MASSADINE',
            'nom': 'Leoni Massadine',
            'nom_ar': 'ليوني مساكن',
            'adresse': 'Zone Industrielle, Massadine',
            'telephone': '+216 73 234 567',
        },
        {
            'code': 'MATEUR',
            'nom': 'Leoni Mateur',
            'nom_ar': 'ليوني ماطر',
            'adresse': 'Zone Industrielle, Mateur',
            'telephone': '+216 72 345 678',
        },
    ]

    for item in updates:
        Site.objects.update_or_create(code=item['code'], defaults=item)


class Migration(migrations.Migration):

    dependencies = [
        ('account', '0008_seed_sites'),
    ]

    operations = [
        migrations.RunPython(update_site_details, migrations.RunPython.noop),
    ]
