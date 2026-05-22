"""
Tests site_scope — vérifie le filtrage par site des visites périodiques
"""
import pytest
from django.contrib.auth.models import User
from apps.account.models import Profile, Site, MedType, Medecin
from apps.visites_periodiques.site_scope import (
    liste_vp_site_q,
    filter_listes_vp_queryset_par_site,
    liste_vp_accessible_sur_site,
)
from apps.visites_periodiques.models import ListeVisitePeriodique


@pytest.mark.django_db
def test_filter_listes_vp_site_none_retourne_tout():
    """Si site est None, le filtre ne restreint rien"""
    qs = ListeVisitePeriodique.objects.all()
    result = filter_listes_vp_queryset_par_site(qs, None)
    assert list(result) == list(qs)


@pytest.mark.django_db
def test_liste_vp_accessible_site_none():
    """Si site est None, toute liste est accessible"""
    result = liste_vp_accessible_sur_site(9999, None)
    assert result is True


@pytest.mark.django_db
def test_liste_vp_accessible_id_inexistant():
    """Une liste inexistante n'est pas accessible"""
    site, _ = Site.objects.get_or_create(
        code='SCOPE_TEST',
        defaults={
            'nom': 'Site Scope', 'nom_ar': '',
            'adresse': '', 'telephone': '',
            'template_key': 'MONASTIR'
        }
    )
    result = liste_vp_accessible_sur_site(99999, site)
    assert result is False


@pytest.mark.django_db
def test_liste_vp_site_q_retourne_q_object():
    """liste_vp_site_q retourne bien un objet Q"""
    from django.db.models import Q
    site, _ = Site.objects.get_or_create(
        code='SCOPE_Q',
        defaults={
            'nom': 'Site Q', 'nom_ar': '',
            'adresse': '', 'telephone': '',
            'template_key': 'MONASTIR'
        }
    )
    q = liste_vp_site_q(site)
    assert isinstance(q, Q)


@pytest.mark.django_db
def test_filter_listes_vp_avec_site_retourne_queryset():
    """filter_listes_vp_queryset_par_site avec un site retourne un queryset"""
    site, _ = Site.objects.get_or_create(
        code='SCOPE_FILTER',
        defaults={
            'nom': 'Site Filter', 'nom_ar': '',
            'adresse': '', 'telephone': '',
            'template_key': 'MONASTIR'
        }
    )
    qs = ListeVisitePeriodique.objects.all()
    result = filter_listes_vp_queryset_par_site(qs, site)
    assert hasattr(result, 'filter')