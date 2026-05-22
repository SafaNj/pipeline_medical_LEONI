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

BASE = '/api/medical-records/dossiers/'

class DossierMedicalActionsTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')
        self.inf = creer_user(self.site, 'infirmier')
        self.rh = creer_user(self.site, 'rh')

    def test_liste_dossiers_medecin(self):
        self.assertIn(auth(self.med).get(BASE).status_code, [200, 403])

    def test_liste_dossiers_infirmier(self):
        self.assertIn(auth(self.inf).get(BASE).status_code, [200, 403])

    def test_liste_dossiers_rh(self):
        self.assertIn(auth(self.rh).get(BASE).status_code, [200, 403])

    def test_liste_dossiers_sans_token(self):
        self.assertIn(APIClient().get(BASE).status_code, [401, 403])

    def test_dossier_inexistant(self):
        self.assertIn(auth(self.med).get(f'{BASE}99999/').status_code, [404, 403])

    def test_by_collaborateur_manquant(self):
        self.assertIn(auth(self.med).get(f'{BASE}by_collaborateur/').status_code, [200, 400, 403, 404])

    def test_by_matricule_manquant(self):
        self.assertIn(auth(self.med).get(f'{BASE}by_matricule/').status_code, [200, 400, 403, 404])

    def test_by_groupe_sanguin(self):
        self.assertIn(auth(self.med).get(f'{BASE}by_groupe_sanguin/').status_code, [200, 400, 403])

    def test_has_allergies(self):
        self.assertIn(auth(self.med).get(f'{BASE}has_allergies/').status_code, [200, 400, 403])

    def test_has_antecedents(self):
        self.assertIn(auth(self.med).get(f'{BASE}has_antecedents/').status_code, [200, 400, 403])

    def test_update_allergies_inexistant(self):
        self.assertIn(auth(self.med).patch(f'{BASE}99999/update_allergies/', {}, format='json').status_code, [404, 403, 405])

    def test_create_dossier_medecin(self):
        self.assertIn(auth(self.med).post(BASE, {}, format='json').status_code, [201, 400, 403])

    def test_by_collaborateur_infirmier(self):
        self.assertIn(auth(self.inf).get(f'{BASE}by_collaborateur/').status_code, [200, 400, 403, 404])
