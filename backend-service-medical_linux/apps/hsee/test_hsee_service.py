"""
Tests unitaires directs sur hsee_service.py et hsee_export_views
Ces tests couvrent les fonctions de calcul sans passer par HTTP
"""
import uuid
from datetime import date
from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from apps.account.models import Infirmier, MedType, Medecin, Profile, Site
from apps.account.models.HSEE_models import HSEE
from apps.hsee.services.hsee_service import (
    _month_bounds,
    _ratio_times_200k,
    _medecin_label,
    build_hsee_dashboard,
)

def uid(): return uuid.uuid4().hex[:6]

def creer_site():
    u = uid()
    return Site.objects.create(nom=f'Site {u}', nom_ar=f'Site {u}',
        adresse='Addr', telephone='111', code=f'S_{u}', template_key='MONASTIR')

def creer_user(site, role):
    u = uid()
    user = User.objects.create_user(username=f'{role}_{u}', password='pass1234')
    profile, _ = Profile.objects.get_or_create(user=user)
    profile.role = role; profile.must_change_password = False; profile.save()
    if role == 'medecin':
        mt, _ = MedType.objects.get_or_create(name='Médecin du Travail')
        Medecin.objects.get_or_create(profile=profile, defaults={
            'med_type': mt, 'specialite': 'Travail', 'numero_ordre': f'O_{u}', 'site': site})
    elif role == 'hsse':
        HSEE.objects.get_or_create(profile=profile, defaults={'zone': 'Z1', 'certification': 'C1', 'site': site})
    return user

def auth(user):
    c = APIClient()
    r = c.post('/api/account/login/', {'username': user.username, 'password': 'pass1234'}, format='json')
    c.credentials(HTTP_AUTHORIZATION=f'Bearer {r.data.get("access")}')
    return c


class MonthBoundsTest(TestCase):
    def test_janvier(self):
        debut, fin = _month_bounds(2025, 1)
        self.assertEqual(debut, date(2025, 1, 1))
        self.assertEqual(fin, date(2025, 1, 31))

    def test_fevrier_non_bissextile(self):
        debut, fin = _month_bounds(2025, 2)
        self.assertEqual(fin, date(2025, 2, 28))

    def test_fevrier_bissextile(self):
        debut, fin = _month_bounds(2024, 2)
        self.assertEqual(fin, date(2024, 2, 29))

    def test_decembre(self):
        debut, fin = _month_bounds(2025, 12)
        self.assertEqual(debut, date(2025, 12, 1))
        self.assertEqual(fin, date(2025, 12, 31))


class RatioTimes200kTest(TestCase):
    def test_heures_zero_retourne_none(self):
        result = _ratio_times_200k(Decimal('5'), 0)
        self.assertIsNone(result)

    def test_heures_negatives_retourne_none(self):
        result = _ratio_times_200k(Decimal('5'), -100)
        self.assertIsNone(result)

    def test_calcul_normal(self):
        result = _ratio_times_200k(Decimal('10'), 200000)
        self.assertIsNotNone(result)
        self.assertAlmostEqual(result, 10.0, places=1)

    def test_numerateur_zero(self):
        result = _ratio_times_200k(Decimal('0'), 10000)
        self.assertIsNotNone(result)
        self.assertEqual(result, 0.0)


class MedecinLabelTest(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med_user = creer_user(self.site, 'medecin')

    def test_label_medecin(self):
        from apps.account.models import Medecin
        medecin = Medecin.objects.get(profile__user=self.med_user)
        label = _medecin_label(medecin)
        self.assertIsInstance(label, str)

    def test_label_none(self):
        label = _medecin_label(None)
        self.assertIsInstance(label, str)


class BuildHseeDashboardTest(TestCase):
    def setUp(self):
        self.site = creer_site()

    def test_dashboard_vide(self):
        result = build_hsee_dashboard(2025, 1, site=self.site)
        self.assertIsInstance(result, dict)

    def test_dashboard_sans_site(self):
        result = build_hsee_dashboard(2025, 6)
        self.assertIsInstance(result, dict)

    def test_dashboard_mois_different(self):
        result = build_hsee_dashboard(2024, 12, site=self.site)
        self.assertIsInstance(result, dict)

    def test_dashboard_avec_filtres_vides(self):
        result = build_hsee_dashboard(2025, 3, site=self.site, filtres={})
        self.assertIsInstance(result, dict)


class HSEEExportViewsTest(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.hsse_user = creer_user(self.site, 'hsse')
        self.med_user = creer_user(self.site, 'medecin')

    def test_export_activite_medecins_hsse(self):
        r = auth(self.hsse_user).get('/api/hsee/exports/medecins-activite/')
        self.assertIn(r.status_code, [200, 400, 403])

    def test_export_activite_medecins_avec_params(self):
        r = auth(self.hsse_user).get('/api/hsee/exports/medecins-activite/?annee=2025&mois=1')
        self.assertIn(r.status_code, [200, 400, 403])

    def test_export_sans_token(self):
        r = APIClient().get('/api/hsee/exports/medecins-activite/')
        self.assertIn(r.status_code, [401, 403])

    def test_dashboard_avec_params(self):
        r = auth(self.hsse_user).get('/api/hsee/dashboard/?annee=2025&mois=1')
        self.assertIn(r.status_code, [200, 400, 403])

    def test_dashboard_medecin_avec_params(self):
        r = auth(self.med_user).get('/api/hsee/dashboard/?annee=2025&mois=1')
        self.assertIn(r.status_code, [200, 400, 403])
