import pytest
from rest_framework.test import APIClient

@pytest.fixture
def client():
    return APIClient()

@pytest.mark.django_db
def test_access_protected_route_without_token(client):
    """Sans token JWT → doit retourner 401"""
    response = client.get('/api/account/profiles/')
    assert response.status_code == 401

@pytest.mark.django_db
def test_login_with_wrong_password(client):
    """Mauvais mot de passe → doit retourner 401"""
    response = client.post('/api/account/login/', {
        'username': 'utilisateur_inexistant',
        'password': 'mauvais_mot_de_passe'
    }, format='json')
    assert response.status_code in [400, 401]

@pytest.mark.django_db
def test_forged_token_is_rejected(client):
    """Token forgé → doit être rejeté"""
    fake_token = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxfQ.fakesignature"
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {fake_token}')
    response = client.get('/api/account/profiles/')
    assert response.status_code == 401

@pytest.mark.django_db
def test_missing_bearer_prefix(client):
    """Token sans préfixe Bearer → doit être rejeté"""
    client.credentials(HTTP_AUTHORIZATION='Token sometoken123')
    response = client.get('/api/account/profiles/')
    assert response.status_code == 401

@pytest.mark.django_db
def test_empty_authorization_header(client):
    """Header Authorization vide → doit retourner 401"""
    client.credentials(HTTP_AUTHORIZATION='')
    response = client.get('/api/account/profiles/')
    assert response.status_code == 401

@pytest.mark.django_db
def test_refresh_token_reutilise_apres_rotation(client):
    """Un refresh token ne doit pas pouvoir être utilisé deux fois"""
    from django.contrib.auth.models import User
    from apps.account.models import Profile, Site, Medecin, MedType
    import uuid

    uid = uuid.uuid4().hex[:8]
    site, _ = Site.objects.get_or_create(
        code=f'S_{uid}',
        defaults={
            'nom': f'Site {uid}', 'nom_ar': '',
            'adresse': '', 'telephone': '',
            'template_key': 'MONASTIR'
        }
    )
    med_type, _ = MedType.objects.get_or_create(name='travail')
    user = User.objects.create_user(
        username=f'user_{uid}', password='TestPass2026!'
    )
    profile, _ = Profile.objects.get_or_create(user=user)
    profile.role = 'medecin'
    profile.must_change_password = False
    profile.save()
    Medecin.objects.get_or_create(
        profile=profile,
        defaults={
            'med_type': med_type,
            'specialite': 'Travail',
            'numero_ordre': uid,
            'site': site
        }
    )

    resp = client.post('/api/account/login/', {
        'username': f'user_{uid}',
        'password': 'TestPass2026!'
    }, format='json')
    assert resp.status_code == 200
    refresh_token = resp.data['refresh']

    resp1 = client.post('/api/account/refresh/', {
        'refresh': refresh_token
    }, format='json')
    assert resp1.status_code == 200

    resp2 = client.post('/api/account/refresh/', {
        'refresh': refresh_token
    }, format='json')
    assert resp2.status_code == 401