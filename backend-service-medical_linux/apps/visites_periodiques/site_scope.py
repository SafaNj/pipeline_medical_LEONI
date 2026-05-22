"""Périmètre site pour les listes VP (médecin assigné ou créateur du même site)."""

from django.db.models import Q

from apps.visites_periodiques.models import ListeVisitePeriodique


def liste_vp_site_q(site):
    """Q object : une liste appartient au site si médecin ou créateur (RH / infirmier / médecin)."""
    return (
        Q(medecin__site_id=site.id)
        | Q(cree_par__rh__site_id=site.id)
        | Q(cree_par__infirmier__site_id=site.id)
        | Q(cree_par__medecin__site_id=site.id)
    )


def filter_listes_vp_queryset_par_site(qs, site):
    if site is None:
        return qs
    return qs.filter(liste_vp_site_q(site))


def liste_vp_accessible_sur_site(liste_id: int, site) -> bool:
    """True si la liste est dans le périmètre du site (ou pas de contrainte si site is None)."""
    if site is None:
        return True
    return ListeVisitePeriodique.objects.filter(
        Q(pk=liste_id),
        liste_vp_site_q(site),
    ).exists()
