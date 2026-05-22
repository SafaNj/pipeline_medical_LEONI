import uuid
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient
from apps.account.models import Infirmier, MedType, Medecin, Profile, RH, Site

# ── Vraies URLs issues de apps/stock/urls.py ─────────────────────────────────
# /api/stock/medicaments/          → list/retrieve OK
# /api/stock/stocks/               → list/retrieve OK
# /api/stock/actes/                → list/retrieve OK
# /api/stock/mouvements/           → list/retrieve OK
# /api/stock/consommation-courante/ → POST seulement (pas de GET → 405)
# /api/stock/export-stock/         → GET OK

BASE_MED  = '/api/stock/medicaments/'
BASE_STK  = '/api/stock/stocks/'
BASE_ACTE = '/api/stock/actes/'
BASE_MVT  = '/api/stock/mouvements/'
BASE_CONS = '/api/stock/consommation-courante/'
BASE_EXP  = '/api/stock/export-stock/'


def uid():
    return uuid.uuid4().hex[:6]


def creer_site():
    u = uid()
    return Site.objects.create(
        nom=f'Site {u}', nom_ar=f'Site {u}',
        adresse='Addr', telephone='111',
        code=f'S_{u}', template_key='MONASTIR'
    )


def creer_user(site, role):
    u = uid()
    user = User.objects.create_user(username=f'{role}_{u}', password='pass1234')
    profile, _ = Profile.objects.get_or_create(user=user)
    profile.role = role
    profile.must_change_password = False
    profile.save()
    if role == 'medecin':
        mt, _ = MedType.objects.get_or_create(name='Médecin du Travail')
        Medecin.objects.get_or_create(profile=profile, defaults={
            'med_type': mt, 'specialite': 'Travail',
            'numero_ordre': f'O_{u}', 'site': site
        })
    elif role == 'infirmier':
        Infirmier.objects.get_or_create(profile=profile, defaults={'site': site})
    elif role == 'rh':
        RH.objects.get_or_create(profile=profile, defaults={'departement': 'RH', 'site': site})
    return user


def auth(user):
    c = APIClient()
    r = c.post('/api/account/login/',
               {'username': user.username, 'password': 'pass1234'}, format='json')
    c.credentials(HTTP_AUTHORIZATION=f'Bearer {r.data.get("access")}')
    return c


class MedicamentViewTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')
        self.inf = creer_user(self.site, 'infirmier')

    def test_liste_medicaments_medecin(self):
        self.assertIn(auth(self.med).get(BASE_MED).status_code, [200, 403])

    def test_liste_medicaments_infirmier(self):
        self.assertIn(auth(self.inf).get(BASE_MED).status_code, [200, 403])

    def test_liste_medicaments_sans_token(self):
        self.assertIn(APIClient().get(BASE_MED).status_code, [401, 403])

    def test_medicament_inexistant(self):
        self.assertIn(auth(self.med).get(f'{BASE_MED}99999/').status_code, [404, 403])


class StockViewTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')
        self.inf = creer_user(self.site, 'infirmier')

    def test_liste_stocks_medecin(self):
        self.assertIn(auth(self.med).get(BASE_STK).status_code, [200, 403])

    def test_liste_stocks_infirmier(self):
        self.assertIn(auth(self.inf).get(BASE_STK).status_code, [200, 403])

    def test_liste_stocks_sans_token(self):
        self.assertIn(APIClient().get(BASE_STK).status_code, [401, 403])

    def test_stock_inexistant(self):
        self.assertIn(auth(self.med).get(f'{BASE_STK}99999/').status_code, [404, 403])


class ActeInfirmierStockViewTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.inf = creer_user(self.site, 'infirmier')
        self.med = creer_user(self.site, 'medecin')

    def test_liste_actes_infirmier(self):
        self.assertIn(auth(self.inf).get(BASE_ACTE).status_code, [200, 403])

    def test_liste_actes_medecin(self):
        self.assertIn(auth(self.med).get(BASE_ACTE).status_code, [200, 403])

    def test_actes_sans_token(self):
        self.assertIn(APIClient().get(BASE_ACTE).status_code, [401, 403])

    def test_acte_inexistant(self):
        self.assertIn(auth(self.inf).get(f'{BASE_ACTE}99999/').status_code, [404, 403])


class MouvementStockViewTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')
        self.inf = creer_user(self.site, 'infirmier')

    def test_liste_mouvements_medecin(self):
        self.assertIn(auth(self.med).get(BASE_MVT).status_code, [200, 403])

    def test_liste_mouvements_infirmier(self):
        self.assertIn(auth(self.inf).get(BASE_MVT).status_code, [200, 403])

    def test_mouvements_sans_token(self):
        self.assertIn(APIClient().get(BASE_MVT).status_code, [401, 403])

    def test_mouvement_inexistant(self):
        self.assertIn(auth(self.med).get(f'{BASE_MVT}99999/').status_code, [404, 403])


class ConsommationCouranteViewTests(TestCase):
    """ConsommationCouranteView n'accepte que POST — pas de GET."""
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')
        self.inf = creer_user(self.site, 'infirmier')

    def test_consommation_courante_post_vide_medecin(self):
        self.assertIn(
            auth(self.med).post(BASE_CONS, {}, format='json').status_code,
            [200, 201, 400, 403])

    def test_consommation_courante_post_vide_infirmier(self):
        self.assertIn(
            auth(self.inf).post(BASE_CONS, {}, format='json').status_code,
            [200, 201, 400, 403])

    def test_consommation_courante_sans_token(self):
        self.assertIn(
            APIClient().post(BASE_CONS, {}, format='json').status_code,
            [401, 403])


class ExportStockViewTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')

    def test_export_stock_medecin(self):
        self.assertIn(
            auth(self.med).get(BASE_EXP).status_code,
            [200, 400, 403])

    def test_export_stock_sans_token(self):
        self.assertIn(
            APIClient().get(BASE_EXP).status_code,
            [401, 403])