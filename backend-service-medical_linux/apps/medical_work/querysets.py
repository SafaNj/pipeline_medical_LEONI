"""
Filtres métier sur les querysets FicheAptitude (notamment alignement im_db / RH).
"""
from __future__ import annotations

from django.db.models import QuerySet

from apps.employees.models import ResourceIM


def filter_fiches_collaborateur_in_im_db(
    queryset: QuerySet,
    im_site_scope=None,
) -> QuerySet:
    """
    Restreint aux fiches dont le collaborateur a un matricule présent dans
    im_db.resource (table ``resource``). Les noms/prénoms Collaborateur
    provenant de im_db restent ainsi cohérents.

    im_site_scope :
      ``None`` — matricule présent dans im_db (tout site), ex. superuser.
      ``str`` — matricule présent dans im_db avec ``resource.site`` égal à ce code.
      ``False`` — aucune fiche (pas de périmètre IM pour l'utilisateur).

    Exclut : fiches sans collaborateur ; matricules non numériques ; matricules
    absents de im_db (ex. fiche liée à un collaborateur medical_db orphelin).
    """
    if im_site_scope is False:
        return queryset.none()

    qs = queryset.filter(collaborateur__isnull=False)
    matricules = list(qs.values_list("collaborateur__matricule", flat=True).distinct())
    int_candidates: list[int] = []
    str_by_int: dict[int, list[str]] = {}
    for raw in matricules:
        s = str(raw or "").strip()
        if not s.isdigit():
            continue
        im = int(s)
        int_candidates.append(im)
        str_by_int.setdefault(im, []).append(s)

    if not int_candidates:
        return qs.none()

    im_qs = ResourceIM.objects.using("im_db").filter(matricule__in=int_candidates)
    if im_site_scope:
        im_qs = im_qs.filter(site=im_site_scope)
    found = set(im_qs.values_list("matricule", flat=True))
    allowed_strs: set[str] = set()
    for im in found:
        for s in str_by_int.get(im, []):
            allowed_strs.add(s)
    if not allowed_strs:
        return qs.none()
    return qs.filter(collaborateur__matricule__in=allowed_strs)
