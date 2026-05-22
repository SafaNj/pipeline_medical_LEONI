"""
Tests du service SMS — format_phone et send_sms
Ces tests augmentent significativement la couverture sans appel réseau réel.
"""
import pytest
from apps.planning.sms_service import format_phone, send_sms, get_last_sms_error


# ============================================================
# Tests format_phone — fonction pure, pas besoin de Django DB
# ============================================================

def test_format_phone_numero_8_chiffres():
    """Numéro tunisien 8 chiffres → ajoute 216"""
    assert format_phone('22334455') == '21622334455'

def test_format_phone_avec_indicatif_216():
    """Numéro déjà avec 216 → retourné tel quel"""
    assert format_phone('21622334455') == '21622334455'

def test_format_phone_avec_plus():
    """Numéro avec + → enlève le +"""
    assert format_phone('+21622334455') == '21622334455'

def test_format_phone_avec_00():
    """Numéro avec 00 → enlève le 00"""
    assert format_phone('0021622334455') == '21622334455'

def test_format_phone_avec_zero_devant():
    """Numéro commençant par 0 → remplace 0 par 216"""
    assert format_phone('022334455') == '21622334455'

def test_format_phone_vide():
    """Numéro vide → retourne chaîne vide"""
    assert format_phone('') == ''

def test_format_phone_none():
    """None → retourne chaîne vide"""
    assert format_phone(None) == ''

def test_format_phone_avec_espaces():
    """Numéro avec espaces → nettoyé correctement"""
    assert format_phone('22 33 44 55') == '21622334455'

def test_format_phone_avec_tirets():
    """Numéro avec tirets → nettoyé correctement"""
    assert format_phone('22-33-44-55') == '21622334455'

def test_format_phone_non_numerique():
    """Texte non numérique → retourne chaîne vide"""
    assert format_phone('abcdefgh') == ''

def test_format_phone_216_trop_court():
    """Numéro avec 216 mais trop court → retourne chaîne vide"""
    assert format_phone('2161234') == ''


# ============================================================
# Tests send_sms — sans appel réseau réel
# ============================================================

def test_send_sms_sans_telephone():
    """SMS sans téléphone → retourne False"""
    result = send_sms(telephone='', message='Test')
    assert result is False
    assert get_last_sms_error() == 'telephone_ou_message_manquant'

def test_send_sms_sans_message():
    """SMS sans message → retourne False"""
    result = send_sms(telephone='22334455', message='')
    assert result is False
    assert get_last_sms_error() == 'telephone_ou_message_manquant'

def test_send_sms_sans_api_key(settings):
    """SMS sans API key configurée → retourne False"""
    settings.TUNISIESMS_API_KEY = None
    result = send_sms(telephone='22334455', message='Test message')
    assert result is False
    assert get_last_sms_error() == 'api_key_manquante'

def test_send_sms_numero_invalide(settings):
    """SMS avec numéro invalide → retourne False"""
    settings.TUNISIESMS_API_KEY = 'fake-key'
    result = send_sms(telephone='abc', message='Test message')
    assert result is False
    assert get_last_sms_error() == 'numero_invalide'

def test_send_sms_timeout(settings, monkeypatch):
    """SMS avec timeout réseau → retourne False"""
    import requests
    settings.TUNISIESMS_API_KEY = 'fake-key'

    def mock_get(*args, **kwargs):
        raise requests.exceptions.Timeout()

    monkeypatch.setattr(requests, 'get', mock_get)
    result = send_sms(telephone='22334455', message='Test')
    assert result is False
    assert get_last_sms_error() == 'gateway_timeout'

def test_send_sms_connection_error(settings, monkeypatch):
    """SMS avec erreur de connexion → retourne False"""
    import requests
    settings.TUNISIESMS_API_KEY = 'fake-key'

    def mock_get(*args, **kwargs):
        raise requests.exceptions.ConnectionError('connexion refusée')

    monkeypatch.setattr(requests, 'get', mock_get)
    result = send_sms(telephone='22334455', message='Test')
    assert result is False
    assert 'gateway_connection_error' in get_last_sms_error()

def test_send_sms_succes(settings, monkeypatch):
    """SMS avec réponse API OK → retourne True"""
    import requests
    settings.TUNISIESMS_API_KEY = 'fake-key'

    class MockResponse:
        status_code = 200
        text = '100 OK'

    monkeypatch.setattr(requests, 'get', lambda *a, **kw: MockResponse())
    result = send_sms(telephone='22334455', message='Test SMS')
    assert result is True

def test_send_sms_echec_api(settings, monkeypatch):
    """SMS avec réponse API erreur → retourne False"""
    import requests
    settings.TUNISIESMS_API_KEY = 'fake-key'

    class MockResponse:
        status_code = 500
        text = 'Erreur serveur'

    monkeypatch.setattr(requests, 'get', lambda *a, **kw: MockResponse())
    result = send_sms(telephone='22334455', message='Test SMS')
    assert result is False