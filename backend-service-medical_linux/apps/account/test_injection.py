import pytest
from rest_framework.test import APIClient

@pytest.fixture
def client():
    return APIClient()

@pytest.mark.django_db
def test_sql_injection_login(client):
    """SQL Injection → doit retourner 401, jamais un token"""
    payloads = [
        {"username": "' OR 1=1--", "password": "x"},
        {"username": "admin'--", "password": "x"},
        {"username": "' OR 'a'='a", "password": "x"},
    ]
    for payload in payloads:
        response = client.post('/api/account/login/', payload, format='json')
        assert response.status_code in [400, 401], \
            f"SQL injection non bloquée avec : {payload}"

@pytest.mark.django_db
def test_xss_dans_username(client):
    """XSS dans username → doit être rejeté"""
    response = client.post('/api/account/login/', {
        "username": "<script>alert(1)</script>",
        "password": "test"
    }, format='json')
    assert response.status_code in [400, 401]
    assert "<script>" not in str(response.data)

@pytest.mark.django_db
def test_mass_assignment(client):
    """Mass assignment → tenter de se donner les droits admin"""
    response = client.post('/api/account/login/', {
        "username": "hacker",
        "password": "test",
        "is_staff": True,
        "is_superuser": True,
        "role": "admin"
    }, format='json')
    assert response.status_code in [400, 401]