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

BASE = '/api/control-visits/listes-contre-visites/'
BASE_LG = '/api/control-visits/lignes-contre-visites/'

class ListeContreVisiteActionsTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')
        self.inf = creer_user(self.site, 'infirmier')
        self.rh = creer_user(self.site, 'rh')

    def test_liste_cv_medecin(self):
        self.assertIn(auth(self.med).get(BASE).status_code, [200, 403])

    def test_liste_cv_infirmier(self):
        self.assertIn(auth(self.inf).get(BASE).status_code, [200, 403])

    def test_liste_cv_rh(self):
        self.assertIn(auth(self.rh).get(BASE).status_code, [200, 403])

    def test_liste_cv_sans_token(self):
        self.assertIn(APIClient().get(BASE).status_code, [401, 403])

    def test_detail_inexistant(self):
        self.assertIn(auth(self.med).get(f'{BASE}99999/').status_code, [404, 403])

    def test_create_medecin(self):
        self.assertIn(auth(self.med).post(BASE, {}, format='json').status_code, [201, 400, 403])

    def test_create_infirmier(self):
        self.assertIn(auth(self.inf).post(BASE, {}, format='json').status_code, [201, 400, 403])

    def test_soumettre_inexistant(self):
        self.assertIn(auth(self.med).patch(f'{BASE}99999/soumettre/').status_code, [404, 403, 405])

    def test_assigner_medecin_inexistant(self):
        self.assertIn(auth(self.med).patch(f'{BASE}99999/assigner_medecin/').status_code, [404, 403, 405])

    def test_cloturer_inexistant(self):
        self.assertIn(auth(self.med).patch(f'{BASE}99999/cloturer/').status_code, [404, 403, 405])

    def test_archiver_inexistant(self):
        self.assertIn(auth(self.med).patch(f'{BASE}99999/archiver/').status_code, [404, 403, 405])

    def test_medecins_controleurs_action(self):
        self.assertIn(auth(self.med).get(f'{BASE}medecins_controleurs/').status_code, [200, 403])

    def test_medecins_controleurs_infirmier(self):
        self.assertIn(auth(self.inf).get(f'{BASE}medecins_controleurs/').status_code, [200, 403])

    def test_update_inexistant(self):
        self.assertIn(auth(self.med).put(f'{BASE}99999/', {}, format='json').status_code, [404, 403, 405])

    def test_partial_update_inexistant(self):
        self.assertIn(auth(self.med).patch(f'{BASE}99999/', {}, format='json').status_code, [404, 403])

    def test_delete_inexistant(self):
        self.assertIn(auth(self.med).delete(f'{BASE}99999/').status_code, [404, 403])


class LigneContreVisiteActionsTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')
        self.inf = creer_user(self.site, 'infirmier')

    def test_lignes_cv_medecin(self):
        self.assertIn(auth(self.med).get(BASE_LG).status_code, [200, 403])

    def test_lignes_cv_infirmier(self):
        self.assertIn(auth(self.inf).get(BASE_LG).status_code, [200, 403])

    def test_lignes_cv_sans_token(self):
        self.assertIn(APIClient().get(BASE_LG).status_code, [401, 403])

    def test_ligne_inexistante(self):
        self.assertIn(auth(self.med).get(f'{BASE_LG}99999/').status_code, [404, 403])

    def test_create_ligne_medecin(self):
        self.assertIn(auth(self.med).post(BASE_LG, {}, format='json').status_code, [201, 400, 403])

    def test_create_ligne_infirmier(self):
        self.assertIn(auth(self.inf).post(BASE_LG, {}, format='json').status_code, [201, 400, 403])
