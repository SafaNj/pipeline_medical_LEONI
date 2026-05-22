from django.db import migrations, models


def populate_dossier_sites(apps, schema_editor):
    DossierMedical = apps.get_model('medical_records', 'DossierMedical')
    FicheAptitude = apps.get_model('medical_work', 'FicheAptitude')
    CandidatEmbauche = apps.get_model('embauche', 'CandidatEmbauche')

    for dossier in DossierMedical.objects.all():
        site_id = None

        if dossier.collaborateur_id:
            fiche = (
                FicheAptitude.objects.select_related('site')
                .filter(collaborateur_id=dossier.collaborateur_id)
                .order_by('-date_visite', '-pk')
                .first()
            )
            if fiche and fiche.site_id:
                site_id = fiche.site_id

        if not site_id and dossier.matricule_ref:
            candidat = (
                CandidatEmbauche.objects.select_related('liste__medecin__site')
                .filter(matricule=dossier.matricule_ref)
                .order_by('-date_creation')
                .first()
            )
            if candidat and candidat.liste_id and candidat.liste.medecin_id:
                site_id = candidat.liste.medecin.site_id

        if site_id:
            DossierMedical.objects.filter(pk=dossier.pk).update(site_id=site_id)


def reverse_populate_dossier_sites(apps, schema_editor):
    DossierMedical = apps.get_model('medical_records', 'DossierMedical')
    DossierMedical.objects.update(site=None)


class Migration(migrations.Migration):

    dependencies = [
        ('medical_records', '0005_add_matricule_ref_dossier'),
    ]

    operations = [
        migrations.AddField(
            model_name='dossiermedical',
            name='site',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name='dossiers_medicaux',
                to='account.site',
            ),
        ),
        migrations.RunPython(populate_dossier_sites, reverse_populate_dossier_sites),
    ]
