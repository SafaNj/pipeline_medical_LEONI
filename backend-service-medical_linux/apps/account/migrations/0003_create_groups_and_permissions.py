from django.db import migrations
from django.contrib.auth.models import Group, Permission


def create_groups(apps, schema_editor):

    # Medecin_Traitant
    groupe, created = Group.objects.get_or_create(name="Medecin_Traitant")
    permissions = Permission.objects.filter(
        codename__in=[
            "view_consultation", "add_consultation",
            "change_consultation", "delete_consultation",
            "view_ordonnance", "add_ordonnance",
            "change_ordonnance", "delete_ordonnance",
            "view_certificatmedical", "add_certificatmedical",
            "change_certificatmedical", "delete_certificatmedical",
            "view_dossiermedical",
            "view_listepassage",
            "view_itempassage", "change_itempassage",
        ]
    )
    groupe.permissions.set(permissions)

    # Medecin_Travail
    groupe, created = Group.objects.get_or_create(name="Medecin_Travail")
    permissions = Permission.objects.filter(
        codename__in=[
            "view_dossiermedical", "add_dossiermedical",
            "change_dossiermedical", "delete_dossiermedical",
            "view_ficheaptitude", "add_ficheaptitude",
            "change_ficheaptitude", "delete_ficheaptitude",
            "view_certificataptitude", "add_certificataptitude",
            "change_certificataptitude", "delete_certificataptitude",
            "view_demandebilan", "add_demandebilan",
            "change_demandebilan", "delete_demandebilan",
            "view_demandeexamen", "add_demandeexamen",
            "change_demandeexamen", "delete_demandeexamen",
        ]
    )
    groupe.permissions.set(permissions)

    # Medecin_Controleur
    groupe, created = Group.objects.get_or_create(name="Medecin_Controleur")
    permissions = Permission.objects.filter(
        codename__in=[
            "view_dossiermedical",
            "view_contrevisite", "add_contrevisite",
            "change_contrevisite", "delete_contrevisite",
            "view_controlemedical", "add_controlemedical",
            "change_controlemedical", "delete_controlemedical",
            "view_listepassage",
            "view_itempassage", "change_itempassage",
        ]
    )
    groupe.permissions.set(permissions)

    # Infirmier
    groupe, created = Group.objects.get_or_create(name="Infirmier")
    permissions = Permission.objects.filter(
        codename__in=[
            "view_consultation",
            "view_dossiermedical",
            "view_demandebilan",
            "view_demandeexamen",
            "view_listepassage", "add_listepassage",
            "change_listepassage", "delete_listepassage",
            "view_itempassage", "add_itempassage",
            "change_itempassage", "delete_itempassage",
        ]
    )
    groupe.permissions.set(permissions)

    # RH
    groupe, created = Group.objects.get_or_create(name="RH")
    permissions = Permission.objects.filter(
        codename__in=[
            "view_collaborateur", "add_collaborateur",
            "change_collaborateur", "delete_collaborateur",
        ]
    )
    groupe.permissions.set(permissions)

    # HSSE
    groupe, created = Group.objects.get_or_create(name="HSSE")
    permissions = Permission.objects.filter(
        codename__in=[
            "view_ficheaptitude",
            "view_certificataptitude",
            "view_contrevisite",
            "view_controlemedical",
        ]
    )
    groupe.permissions.set(permissions)


def delete_groups(apps, schema_editor):
    Group.objects.filter(name__in=[
        "Medecin_Traitant",
        "Medecin_Travail",
        "Medecin_Controleur",
        "Infirmier",
        "RH",
        "HSSE",
    ]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("account", "0002_profile_must_change_password"),
    ]

    operations = [
        migrations.RunPython(create_groups, delete_groups),
    ]
