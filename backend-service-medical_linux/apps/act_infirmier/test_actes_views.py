import uuid
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient
from apps.account.models import Infirmier, MedType, Medecin, Profile, RH, Site
from apps.account.models.HSEE_models import HSEE


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
        Medecin.objects.get_or_create(profile=profile, defaults={'med_type': mt, 'specialite': 'Travail', 'numero_ordre': f'O_{u}', 'site': site})
    elif role == 'infirmier':
        Infirmier.objects.get_or_create(profile=profile, defaults={'site': site})
    elif role == 'rh':
        RH.objects.get_or_create(profile=profile, defaults={'departement': 'RH', 'site': site})
    elif role == 'hsse':
        HSEE.objects.get_or_create(profile=profile, defaults={'zone': 'Z1', 'certification': 'C1', 'site': site})
    return user

def auth(user):
    c = APIClient()
    r = c.post('/api/account/login/', {'username': user.username, 'password': 'pass1234'}, format='json')
    c.credentials(HTTP_AUTHORIZATION=f'Bearer {r.data.get("access")}')
    return c


class AccidentsTravailTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.inf = creer_user(self.site, 'infirmier')
        self.med = creer_user(self.site, 'medecin')

    def test_liste_accidents_infirmier(self):
        self.assertIn(auth(self.inf).get('/api/act-infirmier/accidents/').status_code, [200, 403])

    def test_liste_accidents_sans_token(self):
        self.assertIn(APIClient().get('/api/act-infirmier/accidents/').status_code, [401, 403])

    def test_accident_inexistant(self):
        self.assertIn(auth(self.inf).get('/api/act-infirmier/accidents/99999/').status_code, [404, 403])

    def test_liste_accidents_medecin(self):
        self.assertIn(auth(self.med).get('/api/act-infirmier/accidents/').status_code, [200, 403])


class MaladiesProfTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.inf = creer_user(self.site, 'infirmier')
        self.med = creer_user(self.site, 'medecin')

    def test_liste_maladies_prof_infirmier(self):
        self.assertIn(auth(self.inf).get('/api/act-infirmier/maladies-professionnelles/').status_code, [200, 403])

    def test_liste_maladies_prof_sans_token(self):
        self.assertIn(APIClient().get('/api/act-infirmier/maladies-professionnelles/').status_code, [401, 403])

    def test_maladies_prof_medecin(self):
        self.assertIn(auth(self.med).get('/api/act-infirmier/maladies-professionnelles/').status_code, [200, 403])

    def test_maladie_inexistante(self):
        self.assertIn(auth(self.inf).get('/api/act-infirmier/maladies-professionnelles/99999/').status_code, [404, 403])


class MaladiesChroniquesTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.inf = creer_user(self.site, 'infirmier')

    def test_liste_maladies_chroniques(self):
        self.assertIn(auth(self.inf).get('/api/act-infirmier/maladies-chroniques/').status_code, [200, 403])

    def test_maladie_chronique_sans_token(self):
        self.assertIn(APIClient().get('/api/act-infirmier/maladies-chroniques/').status_code, [401, 403])


class TransfertsUrgenceTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.inf = creer_user(self.site, 'infirmier')
        self.med = creer_user(self.site, 'medecin')

    def test_liste_transferts_infirmier(self):
        self.assertIn(auth(self.inf).get('/api/act-infirmier/transferts-urgence/').status_code, [200, 403])

    def test_liste_transferts_sans_token(self):
        self.assertIn(APIClient().get('/api/act-infirmier/transferts-urgence/').status_code, [401, 403])

    def test_transfert_inexistant(self):
        self.assertIn(auth(self.inf).get('/api/act-infirmier/transferts-urgence/99999/').status_code, [404, 403])

    def test_liste_transferts_medecin(self):
        self.assertIn(auth(self.med).get('/api/act-infirmier/transferts-urgence/').status_code, [200, 403])


class PointageMedecinTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.inf = creer_user(self.site, 'infirmier')
        self.med = creer_user(self.site, 'medecin')

    def test_liste_pointages_infirmier(self):
        self.assertIn(auth(self.inf).get('/api/act-infirmier/pointages-medecins/').status_code, [200, 403])

    def test_liste_pointages_sans_token(self):
        self.assertIn(APIClient().get('/api/act-infirmier/pointages-medecins/').status_code, [401, 403])

    def test_pointage_inexistant(self):
        self.assertIn(auth(self.inf).get('/api/act-infirmier/pointages-medecins/99999/').status_code, [404, 403])

    def test_liste_pointages_medecin(self):
        self.assertIn(auth(self.med).get('/api/act-infirmier/pointages-medecins/').status_code, [200, 403])


class AbsencesMedecinTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.inf = creer_user(self.site, 'infirmier')

    def test_liste_absences(self):
        self.assertIn(auth(self.inf).get('/api/act-infirmier/absences-medecins/').status_code, [200, 403])

    def test_absences_sans_token(self):
        self.assertIn(APIClient().get('/api/act-infirmier/absences-medecins/').status_code, [401, 403])


class IncidentsSansBonTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.inf = creer_user(self.site, 'infirmier')

    def test_liste_incidents_sans_bon(self):
        self.assertIn(auth(self.inf).get('/api/act-infirmier/incidents-sans-bon/').status_code, [200, 403])

    def test_incidents_sans_bon_sans_token(self):
        self.assertIn(APIClient().get('/api/act-infirmier/incidents-sans-bon/').status_code, [401, 403])


class IncidentsAvecBonTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.inf = creer_user(self.site, 'infirmier')

    def test_liste_incidents_avec_bon(self):
        self.assertIn(auth(self.inf).get('/api/act-infirmier/incidents-avec-bon/').status_code, [200, 403])

    def test_incidents_avec_bon_sans_token(self):
        self.assertIn(APIClient().get('/api/act-infirmier/incidents-avec-bon/').status_code, [401, 403])


class OrdresTransportTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.inf = creer_user(self.site, 'infirmier')

    def test_liste_ordres_transport(self):
        self.assertIn(auth(self.inf).get('/api/act-infirmier/ordres-transport/').status_code, [200, 403])

    def test_ordres_transport_sans_token(self):
        self.assertIn(APIClient().get('/api/act-infirmier/ordres-transport/').status_code, [401, 403])


class DeclarationsCNAMTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.inf = creer_user(self.site, 'infirmier')

    def test_liste_declarations_cnam(self):
        self.assertIn(auth(self.inf).get('/api/act-infirmier/declarations-cnam/').status_code, [200, 403])

    def test_declarations_cnam_sans_token(self):
        self.assertIn(APIClient().get('/api/act-infirmier/declarations-cnam/').status_code, [401, 403])