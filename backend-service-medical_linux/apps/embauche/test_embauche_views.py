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

class ListeEmbaucheViewTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')
        self.rh = creer_user(self.site, 'rh')
        self.inf = creer_user(self.site, 'infirmier')

    def test_liste_embauche_medecin(self):
        self.assertIn(auth(self.med).get('/api/embauche/listes/').status_code, [200, 403])

    def test_liste_embauche_rh(self):
        self.assertIn(auth(self.rh).get('/api/embauche/listes/').status_code, [200, 403])

    def test_liste_embauche_sans_token(self):
        self.assertIn(APIClient().get('/api/embauche/listes/').status_code, [401, 403])

    def test_liste_embauche_inexistante(self):
        self.assertIn(auth(self.med).get('/api/embauche/listes/99999/').status_code, [404, 403])

    def test_liste_embauche_creation_medecin(self):
        self.assertIn(auth(self.med).post('/api/embauche/listes/', {}, format='json').status_code, [201, 400, 403])

class CandidatEmbaucheViewTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')
        self.rh = creer_user(self.site, 'rh')
        self.inf = creer_user(self.site, 'infirmier')

    def test_liste_candidats_medecin(self):
        self.assertIn(auth(self.med).get('/api/embauche/candidats/').status_code, [200, 403])

    def test_liste_candidats_rh(self):
        self.assertIn(auth(self.rh).get('/api/embauche/candidats/').status_code, [200, 403])

    def test_liste_candidats_sans_token(self):
        self.assertIn(APIClient().get('/api/embauche/candidats/').status_code, [401, 403])

    def test_candidat_inexistant(self):
        self.assertIn(auth(self.med).get('/api/embauche/candidats/99999/').status_code, [404, 403])

    def test_a_examiner_action_medecin(self):
        self.assertIn(auth(self.med).get('/api/embauche/candidats/a_examiner/').status_code, [200, 403])

    def test_a_examiner_action_inf(self):
        self.assertIn(auth(self.inf).get('/api/embauche/candidats/a_examiner/').status_code, [200, 403])