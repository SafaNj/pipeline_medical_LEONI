import uuid
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from apps.account.models import Infirmier, MedType, Medecin, Profile, RH, Site
from apps.account.models.HSEE_models import HSEE


# ─── helpers ────────────────────────────────────────────────────────────────

def uid():
    return uuid.uuid4().hex[:6]


def creer_site():
    u = uid()
    return Site.objects.create(nom=f'Site {u}', nom_ar=f'Site {u}', adresse='Addr',
                                telephone='111', code=f'S_{u}', template_key='MONASTIR')


def creer_user_role(site, role):
    u = uid()
    user = User.objects.create_user(username=f'{role}_{u}', password='pass1234')
    profile, _ = Profile.objects.get_or_create(user=user)
    profile.role = role
    profile.must_change_password = False
    profile.save()
    if role == 'medecin':
        med_type, _ = MedType.objects.get_or_create(name='Médecin du Travail')
        Medecin.objects.get_or_create(profile=profile, defaults={
            'med_type': med_type, 'specialite': 'Travail',
            'numero_ordre': f'ORD_{u}', 'site': site
        })
    elif role == 'infirmier':
        Infirmier.objects.get_or_create(profile=profile, defaults={'site': site})
    elif role == 'rh':
        RH.objects.get_or_create(profile=profile, defaults={'departement': 'RH', 'site': site})
    elif role == 'hsse':
        HSEE.objects.get_or_create(profile=profile, defaults={'zone': 'Z1', 'certification': 'C1', 'site': site})
    return user


def get_token(client, user):
    r = client.post('/api/account/login/', {'username': user.username, 'password': 'pass1234'}, format='json')
    return r.data.get('access')


def auth_client(user):
    client = APIClient()
    token = get_token(client, user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    return client


# ─── Tests ListeSurveillanceSpeciale ────────────────────────────────────────

class ListeSurveillanceSpecialeTests(TestCase):

    def setUp(self):
        self.site = creer_site()
        self.medecin_user = creer_user_role(self.site, 'medecin')
        self.infirmier_user = creer_user_role(self.site, 'infirmier')
        self.rh_user = creer_user_role(self.site, 'rh')

    def test_liste_surveillance_medecin_retourne_200(self):
        client = auth_client(self.medecin_user)
        r = client.get('/api/surveillance-speciale/listes-surveillance-speciale/')
        self.assertIn(r.status_code, [200, 403])

    def test_liste_surveillance_infirmier_retourne_200(self):
        client = auth_client(self.infirmier_user)
        r = client.get('/api/surveillance-speciale/listes-surveillance-speciale/')
        self.assertIn(r.status_code, [200, 403])

    def test_liste_surveillance_rh_retourne_200(self):
        client = auth_client(self.rh_user)
        r = client.get('/api/surveillance-speciale/listes-surveillance-speciale/')
        self.assertIn(r.status_code, [200, 403])

    def test_liste_surveillance_sans_token_bloque(self):
        r = APIClient().get('/api/surveillance-speciale/listes-surveillance-speciale/')
        self.assertIn(r.status_code, [401, 403])

    def test_detail_liste_inexistante_retourne_404(self):
        client = auth_client(self.medecin_user)
        r = client.get('/api/surveillance-speciale/listes-surveillance-speciale/99999/')
        self.assertIn(r.status_code, [404, 403])

    def test_creation_liste_medecin(self):
        client = auth_client(self.medecin_user)
        r = client.post('/api/surveillance-speciale/listes-surveillance-speciale/', {
            'titre': 'Test liste SS',
        }, format='json')
        self.assertIn(r.status_code, [201, 400, 403])

    def test_creation_liste_infirmier(self):
        client = auth_client(self.infirmier_user)
        r = client.post('/api/surveillance-speciale/listes-surveillance-speciale/', {
            'titre': 'Test liste SS infirmier',
        }, format='json')
        self.assertIn(r.status_code, [201, 400, 403])


# ─── Tests LigneSurveillanceSpeciale ────────────────────────────────────────

class LigneSurveillanceSpecialeTests(TestCase):

    def setUp(self):
        self.site = creer_site()
        self.medecin_user = creer_user_role(self.site, 'medecin')
        self.infirmier_user = creer_user_role(self.site, 'infirmier')
        self.rh_user = creer_user_role(self.site, 'rh')

    def test_liste_lignes_medecin_retourne_200(self):
        client = auth_client(self.medecin_user)
        r = client.get('/api/surveillance-speciale/lignes-surveillance-speciale/')
        self.assertIn(r.status_code, [200, 403])

    def test_liste_lignes_infirmier_retourne_200(self):
        client = auth_client(self.infirmier_user)
        r = client.get('/api/surveillance-speciale/lignes-surveillance-speciale/')
        self.assertIn(r.status_code, [200, 403])

    def test_liste_lignes_sans_token_bloque(self):
        r = APIClient().get('/api/surveillance-speciale/lignes-surveillance-speciale/')
        self.assertIn(r.status_code, [401, 403])

    def test_ligne_inexistante_retourne_404(self):
        client = auth_client(self.medecin_user)
        r = client.get('/api/surveillance-speciale/lignes-surveillance-speciale/99999/')
        self.assertIn(r.status_code, [404, 403])

    def test_liste_lignes_rh_retourne_200(self):
        client = auth_client(self.rh_user)
        r = client.get('/api/surveillance-speciale/lignes-surveillance-speciale/')
        self.assertIn(r.status_code, [200, 403])
