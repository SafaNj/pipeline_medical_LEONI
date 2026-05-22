import pytest
import base64
import json
from rest_framework.test import APIClient

@pytest.fixture
def client():
    return APIClient()

@pytest.mark.django_db
def test_token_algorithme_none(client):
    """Attaque JWT classique — algorithme none doit être rejeté"""
    header = base64.b64encode(
        json.dumps({"alg": "none", "typ": "JWT"}).encode()
    ).decode().rstrip('=')
    payload = base64.b64encode(
        json.dumps({"user_id": 1, "role": "admin"}).encode()
    ).decode().rstrip('=')
    fake_token = f"{header}.{payload}."
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {fake_token}')
    response = client.get('/api/account/profiles/')
    assert response.status_code == 401

@pytest.mark.django_db
def test_token_payload_modifie(client):
    """Payload modifié sans signature valide → rejeté"""
    fake_token = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJyb2xlIjoiYWRtaW4ifQ.invalidsignature"
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {fake_token}')
    response = client.get('/api/account/profiles/')
    assert response.status_code == 401

@pytest.mark.django_db
def test_idor_consultation(client):
    """IDOR — accéder à une ressource sans token"""
    response = client.get('/api/consultations/consultations/9999/')
    assert response.status_code in [401, 404]