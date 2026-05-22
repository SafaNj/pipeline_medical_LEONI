"""
Tests des vues d'authentification — augmente la couverture de auth_views.py
"""
import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from apps.account.models import Profile, Site, MedType, Medecin


@pytest.mark.django_db
def test_login_champs_manquants():
    """Login sans username → erreur 400"""
    client = APIClient()
    r = client.post('/api/account/login/', {'password': 'test'}, format='json')
    assert r.status_code in [400, 401]


@pytest.mark.django_db
def test_login_body_vide():
    """Login body vide → erreur 400"""
    client = APIClient()
    r = client.post('/api/account/login/', {}, format='json')
    assert r.status_code in [400, 401]


@pytest.mark.django_db
def test_refresh_token_invalide():
    """Refresh avec token invalide → 401"""
    client = APIClient()
    r = client.post('/api/account/refresh/', {'refresh': 'invalid.token.here'}, format='json')
    assert r.status_code == 401


@pytest.mark.django_db
def test_refresh_body_vide():
    """Refresh sans token → 400"""
    client = APIClient()
    r = client.post('/api/account/refresh/', {}, format='json')
    assert r.status_code in [400, 401]


@pytest.mark.django_db
def test_login_succes_retourne_tokens():
    """Login réussi → retourne access + refresh + site_id"""
    client = APIClient()
    site, _ = Site.objects.get_or_create(
        code='AUTH_VIEW',
        defaults={'nom': 'Site Auth', 'nom_ar': '', 'adresse': '', 'telephone': '', 'template_key': 'MONASTIR'}
    )
    med_type, _ = MedType.objects.get_or_create(name='travail')
    user = User.objects.create_user(username='med_auth_view', password='Test2026!')
    profile, _ = Profile.objects.get_or_create(user=user)
    profile.role = 'medecin'
    profile.must_change_password = False
    profile.save()
    Medecin.objects.get_or_create(
        profile=profile,
        defaults={'med_type': med_type, 'specialite': 'Travail', 'numero_ordre': 'AUTH001', 'site': site}
    )
    r = client.post('/api/account/login/', {'username': 'med_auth_view', 'password': 'Test2026!'}, format='json')
    assert r.status_code == 200
    assert 'access' in r.data
    assert 'refresh' in r.data
    assert 'site_id' in r.data


@pytest.mark.django_db
def test_must_change_password_bloque_acces():
    """Un utilisateur must_change_password=True → accès bloqué après login"""
    client = APIClient()
    user = User.objects.create_user(username='force_pwd_view', password='Test2026!')
    profile, _ = Profile.objects.get_or_create(user=user)
    profile.role = 'infirmier'
    profile.must_change_password = True
    profile.save()
    r = client.post('/api/account/login/', {'username': 'force_pwd_view', 'password': 'Test2026!'}, format='json')
    if r.status_code == 200:
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {r.data["access"]}')
        r2 = client.get('/api/act-infirmier/listes/')
        assert r2.status_code == 403