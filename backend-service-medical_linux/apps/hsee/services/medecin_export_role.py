"""Rôle « export » d'un médecin : traitant / travail / controleur (aligné sur les listes act-infirmier / embauche)."""
from __future__ import annotations

from apps.account.models import Medecin

TYPE_TRAITANT = "traitant"
TYPE_TRAVAIL = "travail"
TYPE_CONTROLEUR = "controleur"


def export_role_from_medecin(m: Medecin | None) -> str | None:
    """Retourne traitant | travail | controleur, ou None si le libellé MedType ne matche pas."""
    if not m or not m.med_type_id:
        return None
    n = (m.med_type.name or "").lower()
    if "traitant" in n:
        return TYPE_TRAITANT
    if "travail" in n:
        return TYPE_TRAVAIL
    if "contrôleur" in n or "controleur" in n:
        return TYPE_CONTROLEUR
    return None


def validate_medecin_id_for_export(
    medecin_id: int | None, type_medecin: str | None
) -> tuple[Medecin | None, str | None]:
    """
    Vérifie que le médecin existe et, si type_medecin est renseigné, qu'il correspond au type demandé.
    Retourne (instance ou None, message d'erreur ou None).
    """
    if medecin_id is None:
        return None, None
    m = Medecin.objects.select_related("med_type", "profile__user").filter(pk=medecin_id).first()
    if not m:
        return None, "medecin_id inconnu : aucun médecin avec cet identifiant."
    role = export_role_from_medecin(m)
    if role is None:
        return (
            None,
            "Ce médecin n'a pas un type reconnu pour l'export (attendu : traitant, travail ou contrôleur selon le libellé du type).",
        )
    if type_medecin and role != type_medecin:
        return (
            None,
            f"Incohérence filtre : type_medecin={type_medecin!r} mais le médecin #{medecin_id} est classé « {role} » pour cet export.",
        )
    return m, None
