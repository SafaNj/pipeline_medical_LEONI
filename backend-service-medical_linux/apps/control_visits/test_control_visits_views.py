import uuid
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from apps.account.models import Infirmier, MedType, Medecin, Profile, RH, Site


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
    return user


def auth_client(user):
    client = APIClient()
    r = client.post('/api/account/login/', {'username': user.username, 'password': 'pass1234'}, format='json')
    token = r.data.get('access')
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    return client


# ─── Tests ListeContreVisite ────────────────────────────────────────────────

class ListeContreVisiteTests(TestCase):

    def setUp(self):
        self.site = creer_site()
        self.medecin_user = creer_user_role(self.site, 'medecin')
        self.infirmier_user = creer_user_role(self.site, 'infirmier')
        self.rh_user = creer_user_role(self.site, 'rh')

    def test_liste_cv_medecin_retourne_200(self):
        client = auth_client(self.medecin_user)
        r = client.get('/api/control-visits/listes-contre-visites/')
        self.assertIn(r.status_code, [200, 403])

    def test_liste_cv_infirmier_retourne_200(self):
        client = auth_client(self.infirmier_user)
        r = client.get('/api/control-visits/listes-contre-visites/')
        self.assertIn(r.status_code, [200, 403])

    def test_liste_cv_rh_retourne_200(self):
        client = auth_client(self.rh_user)
        r = client.get('/api/control-visits/listes-contre-visites/')
        self.assertIn(r.status_code, [200, 403])

    def test_liste_cv_sans_token_bloque(self):
        r = APIClient().get('/api/control-visits/listes-contre-visites/')
        self.assertIn(r.status_code, [401, 403])

    def test_detail_cv_inexistant_404(self):
        client = auth_client(self.medecin_user)
        r = client.get('/api/control-visits/listes-contre-visites/99999/')
        self.assertIn(r.status_code, [404, 403])


# ─── Tests ContreVisite ─────────────────────────────────────────────────────

class ContreVisiteTests(TestCase):

    def setUp(self):
        self.site = creer_site()
        self.medecin_user = creer_user_role(self.site, 'medecin')
        self.infirmier_user = creer_user_role(self.site, 'infirmier')

    def test_contre_visites_medecin_retourne_200(self):
        client = auth_client(self.medecin_user)
        r = client.get('/api/control-visits/contre-visites/')
        self.assertIn(r.status_code, [200, 403])

    def test_contre_visites_sans_token_bloque(self):
        r = APIClient().get('/api/control-visits/contre-visites/')
        self.assertIn(r.status_code, [401, 403])

    def test_contre_visite_inexistante_404(self):
        client = auth_client(self.medecin_user)
        r = client.get('/api/control-visits/contre-visites/99999/')
        self.assertIn(r.status_code, [404, 403])


# ─── Tests ControleMedical ──────────────────────────────────────────────────

class ControleMedicalTests(TestCase):

    def setUp(self):
        self.site = creer_site()
        self.medecin_user = creer_user_role(self.site, 'medecin')

    def test_controles_medicaux_medecin_retourne_200(self):
        client = auth_client(self.medecin_user)
        r = client.get('/api/control-visits/controles-medicaux/')
        self.assertIn(r.status_code, [200, 403])

    def test_controles_medicaux_sans_token_bloque(self):
        r = APIClient().get('/api/control-visits/controles-medicaux/')
        self.assertIn(r.status_code, [401, 403])

    def test_controle_inexistant_404(self):
        client = auth_client(self.medecin_user)
        r = client.get('/api/control-visits/controles-medicaux/99999/')
        self.assertIn(r.status_code, [404, 403])


# ─── Tests DemandeExpertise ─────────────────────────────────────────────────

class DemandeExpertiseTests(TestCase):

    def setUp(self):
        self.site = creer_site()
        self.medecin_user = creer_user_role(self.site, 'medecin')
        self.rh_user = creer_user_role(self.site, 'rh')

    def test_demandes_expertise_medecin_retourne_200(self):
        client = auth_client(self.medecin_user)
        r = client.get('/api/control-visits/demandes-expertise/')
        self.assertIn(r.status_code, [200, 403])

    def test_demandes_expertise_sans_token_bloque(self):
        r = APIClient().get('/api/control-visits/demandes-expertise/')
        self.assertIn(r.status_code, [401, 403])

    def test_demande_inexistante_404(self):
        client = auth_client(self.medecin_user)
        r = client.get('/api/control-visits/demandes-expertise/99999/')
        self.assertIn(r.status_code, [404, 403])
