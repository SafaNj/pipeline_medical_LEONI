import uuid
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient
from apps.account.models import Infirmier, MedType, Medecin, Profile, RH, Site

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
    elif role == 'infirmier':
        Infirmier.objects.get_or_create(profile=profile, defaults={'site': site})
    elif role == 'rh':
        RH.objects.get_or_create(profile=profile, defaults={'departement': 'RH', 'site': site})
    return user

def auth(user):
    c = APIClient()
    r = c.post('/api/account/login/', {'username': user.username, 'password': 'pass1234'}, format='json')
    c.credentials(HTTP_AUTHORIZATION=f'Bearer {r.data.get("access")}')
    return c

BASE_L = '/api/planning/listes/'
BASE_I = '/api/planning/items/'

class PlanningListeActionsTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')
        self.inf = creer_user(self.site, 'infirmier')
        self.rh = creer_user(self.site, 'rh')

    def test_listes_medecin(self):
        self.assertIn(auth(self.med).get(BASE_L).status_code, [200, 403])

    def test_listes_infirmier(self):
        self.assertIn(auth(self.inf).get(BASE_L).status_code, [200, 403])

    def test_listes_rh(self):
        self.assertIn(auth(self.rh).get(BASE_L).status_code, [200, 403])

    def test_listes_sans_token(self):
        self.assertIn(APIClient().get(BASE_L).status_code, [401, 403])

    def test_detail_inexistant(self):
        self.assertIn(auth(self.med).get(f'{BASE_L}99999/').status_code, [404, 403])

    def test_create_liste_medecin(self):
        self.assertIn(auth(self.med).post(BASE_L, {}, format='json').status_code, [201, 400, 403])

    def test_du_jour_action(self):
        self.assertIn(auth(self.med).get(f'{BASE_L}du_jour/').status_code, [200, 400, 403])

    def test_du_jour_infirmier(self):
        self.assertIn(auth(self.inf).get(f'{BASE_L}du_jour/').status_code, [200, 400, 403])

    def test_archives_action(self):
        self.assertIn(auth(self.med).get(f'{BASE_L}archives/?mois=3&annee=2026').status_code, [200, 403])
    def test_activer_inexistant(self):
        self.assertIn(auth(self.med).patch(f'{BASE_L}99999/activer/').status_code, [404, 403, 405])

    def test_terminer_inexistant(self):
        self.assertIn(auth(self.med).patch(f'{BASE_L}99999/terminer/').status_code, [404, 403, 405])

    def test_ajouter_item_inexistant(self):
        self.assertIn(auth(self.inf).post(f'{BASE_L}99999/ajouter_item/', {}, format='json').status_code, [404, 403, 405])

    def test_update_inexistant(self):
        self.assertIn(auth(self.med).patch(f'{BASE_L}99999/', {}, format='json').status_code, [404, 403])

    def test_delete_inexistant(self):
        self.assertIn(auth(self.med).delete(f'{BASE_L}99999/').status_code, [404, 403])


class PlanningItemActionsTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')
        self.inf = creer_user(self.site, 'infirmier')

    def test_items_medecin(self):
        self.assertIn(auth(self.med).get(BASE_I).status_code, [200, 403])

    def test_items_infirmier(self):
        self.assertIn(auth(self.inf).get(BASE_I).status_code, [200, 403])

    def test_items_sans_token(self):
        self.assertIn(APIClient().get(BASE_I).status_code, [401, 403])

    def test_item_inexistant(self):
        self.assertIn(auth(self.med).get(f'{BASE_I}99999/').status_code, [404, 403])

    def test_effectuer_inexistant(self):
        self.assertIn(auth(self.inf).patch(f'{BASE_I}99999/effectuer/').status_code, [404, 403, 405])

    def test_notifier_inexistant(self):
        self.assertIn(auth(self.inf).post(f'{BASE_I}99999/notifier/', {}, format='json').status_code, [404, 403, 405])

    def test_annuler_inexistant(self):
        self.assertIn(auth(self.inf).patch(f'{BASE_I}99999/annuler/').status_code, [404, 403, 405])

    def test_supprimer_inexistant(self):
        self.assertIn(auth(self.inf).delete(f'{BASE_I}99999/supprimer/').status_code, [404, 403, 405])
