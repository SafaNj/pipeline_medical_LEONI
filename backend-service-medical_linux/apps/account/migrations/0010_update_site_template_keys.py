from django.db import migrations, models


def update_site_template_keys(apps, schema_editor):
    Site = apps.get_model('account', 'Site')

    template_map = {
        'MENZEL_HAYET': 'MONASTIR',
        'MASSADINE': 'SOUSSE',
        'MATER': 'MATEUR',
    }

    for code, template_key in template_map.items():
        Site.objects.filter(code=code).update(template_key=template_key)


def reverse_update_site_template_keys(apps, schema_editor):
    Site = apps.get_model('account', 'Site')
    Site.objects.filter(code__in=['MENZEL_HAYET', 'MASSADINE', 'MATEUR']).update(
        template_key='MONASTIR'
    )


class Migration(migrations.Migration):

    dependencies = [
        ('account', '0009_update_site_details'),
    ]

    operations = [
        migrations.AddField(
            model_name='site',
            name='template_key',
            field=models.CharField(
                choices=[('MONASTIR', 'Monastir'), ('SOUSSE', 'Sousse'), ('MATEUR', 'Mateur')],
                default='MONASTIR',
                max_length=20,
            ),
        ),
        migrations.RunPython(update_site_template_keys, reverse_update_site_template_keys),
    ]
