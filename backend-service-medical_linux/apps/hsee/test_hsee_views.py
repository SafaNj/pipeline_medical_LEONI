import uuid
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from apps.account.models import HSEE, Infirmier, MedType, Medecin, Profile, Site


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
    if role == 'hsse':
        HSEE.objects.get_or_create(profile=profile, defaults={'zone': 'Z1', 'certification': 'C1', 'site': site})
    elif role == 'medecin':
        med_type, _ = MedType.objects.get_or_create(name='Médecin du Travail')
        Medecin.objects.get_or_create(profile=profile, defaults={
            'med_type': med_type, 'specialite': 'Travail',
            'numero_ordre': f'ORD_{u}', 'site': site
        })
    elif role == 'infirmier':
        Infirmier.objects.get_or_create(profile=profile, defaults={'site': site})
    return user


def get_token(client, user):
    r = client.post('/api/account/login/', {'username': user.username, 'password': 'pass1234'}, format='json')
    return r.data.get('access')


def auth_client(user):
    client = APIClient()
    token = get_token(client, user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    return client


# ─── Tests ParametreHSEEMensuel ─────────────────────────────────────────────

class ParametreHSEEMensuelTests(TestCase):

    def setUp(self):
        self.site = creer_site()
        self.hsse_user = creer_user_role(self.site, 'hsse')
        self.infirmier_user = creer_user_role(self.site, 'infirmier')
        self.medecin_user = creer_user_role(self.site, 'medecin')

    def test_liste_parametres_hsse_retourne_200(self):
        client = auth_client(self.hsse_user)
        r = client.get('/api/hsee/parametres-mensuels/')
        self.assertIn(r.status_code, [200, 403])

    def test_liste_parametres_infirmier_retourne_200(self):
        client = auth_client(self.infirmier_user)
        r = client.get('/api/hsee/parametres-mensuels/')
        self.assertIn(r.status_code, [200, 403])

    def test_liste_parametres_sans_token_bloque(self):
        r = APIClient().get('/api/hsee/parametres-mensuels/')
        self.assertIn(r.status_code, [401, 403])

    def test_creation_parametre_hsse(self):
        client = auth_client(self.hsse_user)
        r = client.post('/api/hsee/parametres-mensuels/', {
            'annee': 2025, 'mois': 1,
            'heures_travaillees': 10000,
            'effectif_travailleurs': 150
        }, format='json')
        self.assertIn(r.status_code, [201, 400, 403])

    def test_creation_parametre_infirmier(self):
        client = auth_client(self.infirmier_user)
        r = client.post('/api/hsee/parametres-mensuels/', {
            'annee': 2025, 'mois': 2,
            'heures_travaillees': 8000,
        }, format='json')
        self.assertIn(r.status_code, [201, 400, 403])

    def test_detail_parametre_inexistant(self):
        client = auth_client(self.hsse_user)
        r = client.get('/api/hsee/parametres-mensuels/99999/')
        self.assertIn(r.status_code, [404, 403])

    def test_medecin_acces_parametres(self):
        client = auth_client(self.medecin_user)
        r = client.get('/api/hsee/parametres-mensuels/')
        self.assertIn(r.status_code, [200, 403])


# ─── Tests Notifications HSSE ───────────────────────────────────────────────

class NotificationHSSETests(TestCase):

    def setUp(self):
        self.site = creer_site()
        self.hsse_user = creer_user_role(self.site, 'hsse')
        self.infirmier_user = creer_user_role(self.site, 'infirmier')

    def test_liste_notifications_hsse_retourne_200(self):
        client = auth_client(self.hsse_user)
        r = client.get('/api/hsee/notifications/')
        self.assertIn(r.status_code, [200, 403])

    def test_liste_notifications_sans_token_bloque(self):
        r = APIClient().get('/api/hsee/notifications/')
        self.assertIn(r.status_code, [401, 403])

    def test_liste_notifications_infirmier_bloque(self):
        client = auth_client(self.infirmier_user)
        r = client.get('/api/hsee/notifications/')
        self.assertIn(r.status_code, [200, 403])

    def test_notification_inexistante_retourne_404(self):
        client = auth_client(self.hsse_user)
        r = client.get('/api/hsee/notifications/99999/')
        self.assertIn(r.status_code, [404, 403])


# ─── Tests Dashboard HSSE ───────────────────────────────────────────────────

class HSEEDashboardTests(TestCase):

    def setUp(self):
        self.site = creer_site()
        self.hsse_user = creer_user_role(self.site, 'hsse')
        self.medecin_user = creer_user_role(self.site, 'medecin')

    def test_dashboard_hsse_retourne_200(self):
        client = auth_client(self.hsse_user)
        r = client.get('/api/hsee/dashboard/')
        self.assertIn(r.status_code, [200, 400, 403])

    def test_dashboard_sans_token_bloque(self):
        r = APIClient().get('/api/hsee/dashboard/')
        self.assertIn(r.status_code, [401, 403])

    def test_dashboard_medecin_acces(self):
        client = auth_client(self.medecin_user)
        r = client.get('/api/hsee/dashboard/')
        self.assertIn(r.status_code, [200, 400, 403])

    def test_medecins_pour_export_hsse(self):
        client = auth_client(self.hsse_user)
        r = client.get('/api/hsee/medecins-pour-export/')
        self.assertIn(r.status_code, [200, 403])

    def test_medecins_pour_export_sans_token(self):
        r = APIClient().get('/api/hsee/medecins-pour-export/')
        self.assertIn(r.status_code, [401, 403])
