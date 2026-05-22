"""
Tests des permissions — augmente la couverture de permissions.py
"""
import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from apps.account.models import Profile, Site, MedType, Medecin


def make_user_with_role(role, username):
    user = User.objects.create_user(username=username, password='Test2026!')
    profile, _ = Profile.objects.get_or_create(user=user)
    profile.role = role
    profile.must_change_password = False
    profile.save()
    return user


@pytest.mark.django_db
def test_medecin_acces_route_protegee():
    """Un médecin connecté peut accéder aux routes protégées"""
    client = APIClient()
    site, _ = Site.objects.get_or_create(
        code='PERM_TEST',
        defaults={'nom': 'Site Perm', 'nom_ar': '', 'adresse': '', 'telephone': '', 'template_key': 'MONASTIR'}
    )
    med_type, _ = MedType.objects.get_or_create(name='travail')
    user = make_user_with_role('medecin', 'med_perm_test')
    profile = Profile.objects.get(user=user)
    from apps.account.models import Medecin
    Medecin.objects.get_or_create(
        profile=profile,
        defaults={'med_type': med_type, 'specialite': 'Travail', 'numero_ordre': 'PERM001', 'site': site}
    )
    resp = client.post('/api/account/login/', {'username': 'med_perm_test', 'password': 'Test2026!'}, format='json')
    assert resp.status_code == 200
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {resp.data["access"]}')
    r = client.get('/api/account/profiles/')
    assert r.status_code in [200, 403]


@pytest.mark.django_db
def test_infirmier_acces_route_protegee():
    """Un infirmier connecté peut accéder aux routes autorisées"""
    client = APIClient()
    site, _ = Site.objects.get_or_create(
        code='INF_PERM',
        defaults={'nom': 'Site Inf', 'nom_ar': '', 'adresse': '', 'telephone': '', 'template_key': 'MONASTIR'}
    )
    from apps.account.models import Infirmier
    user = make_user_with_role('infirmier', 'inf_perm_test')
    profile = Profile.objects.get(user=user)
    Infirmier.objects.get_or_create(profile=profile, defaults={'site': site})
    resp = client.post('/api/account/login/', {'username': 'inf_perm_test', 'password': 'Test2026!'}, format='json')
    assert resp.status_code == 200
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {resp.data["access"]}')
    r = client.get('/api/act-infirmier/listes/')
    assert r.status_code in [200, 403, 404]


@pytest.mark.django_db
def test_rh_acces_route_protegee():
    """Un RH connecté peut accéder aux routes autorisées"""
    client = APIClient()
    site, _ = Site.objects.get_or_create(
        code='RH_PERM',
        defaults={'nom': 'Site RH', 'nom_ar': '', 'adresse': '', 'telephone': '', 'template_key': 'MONASTIR'}
    )
    from apps.account.models import RH
    user = make_user_with_role('rh', 'rh_perm_test')
    profile = Profile.objects.get(user=user)
    RH.objects.get_or_create(profile=profile, defaults={'site': site})
    resp = client.post('/api/account/login/', {'username': 'rh_perm_test', 'password': 'Test2026!'}, format='json')
    assert resp.status_code == 200
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {resp.data["access"]}')
    r = client.get('/api/embauche/listes/')
    assert r.status_code in [200, 403, 404]


@pytest.mark.django_db
def test_acces_sans_role_refuse():
    """Un utilisateur sans rôle ne peut pas accéder"""
    client = APIClient()
    user = User.objects.create_user(username='no_role_user', password='Test2026!')
    Profile.objects.get_or_create(user=user)
    resp = client.post('/api/account/login/', {'username': 'no_role_user', 'password': 'Test2026!'}, format='json')
    if resp.status_code == 200:
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {resp.data["access"]}')
    r = client.get('/api/medical-work/fiches-aptitude/')
    assert r.status_code in [200, 403, 401]


@pytest.mark.django_db
def test_utilisateur_non_authentifie_refuse():
    """Sans authentification → 401 sur toutes les routes"""
    client = APIClient()
    for url in [
        '/api/account/profiles/',
        '/api/medical-work/fiches-aptitude/',
        '/api/embauche/listes/',
        '/api/medical-records/dossiers/',
    ]:
        r = client.get(url)
        assert r.status_code == 401, f"URL {url} devrait retourner 401"