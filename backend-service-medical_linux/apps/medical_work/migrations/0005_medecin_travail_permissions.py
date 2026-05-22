from django.db import migrations


def set_medecin_travail_permissions(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")

    groupe, _ = Group.objects.get_or_create(name="Medecin_Travail")

    permission_codenames = [
        "view_ficheaptitude",
        "add_ficheaptitude",
        "change_ficheaptitude",
        "delete_ficheaptitude",
        "view_demandebilan",
        "add_demandebilan",
        "change_demandebilan",
        "delete_demandebilan",
        "view_demandeexamen",
        "add_demandeexamen",
        "change_demandeexamen",
        "delete_demandeexamen",
        "view_certificataptitude",
        "add_certificataptitude",
        "change_certificataptitude",
        "delete_certificataptitude",
        "view_collaborateur",
        "add_dossiermedical",
        "view_dossiermedical",
        "change_dossiermedical",
    ]

    permissions = Permission.objects.filter(codename__in=permission_codenames)
    groupe.permissions.set(permissions)


def unset_medecin_travail_permissions(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    groupe = Group.objects.filter(name="Medecin_Travail").first()
    if groupe:
        groupe.permissions.clear()


class Migration(migrations.Migration):

    dependencies = [
        ("account", "0003_create_groups_and_permissions"),
        ("medical_work", "0004_ficheaptitude_matricule"),
    ]

    operations = [
        migrations.RunPython(
            set_medecin_travail_permissions,
            unset_medecin_travail_permissions,
        ),
    ]
