from django.db import migrations


def seed_sites(apps, schema_editor):
    Site = apps.get_model('account', 'Site')

    sites = [
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

    for item in sites:
        Site.objects.update_or_create(code=item['code'], defaults=item)


def unseed_sites(apps, schema_editor):
    Site = apps.get_model('account', 'Site')
    Site.objects.filter(code__in=['MENZEL_HAYET', 'MASSADINE', 'MATEUR']).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('account', '0007_site_medecin_site'),
    ]

    operations = [
        migrations.RunPython(seed_sites, unseed_sites),
    ]
