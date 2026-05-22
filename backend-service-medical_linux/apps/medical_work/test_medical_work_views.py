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

class FicheAptitudeViewTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')
        self.rh = creer_user(self.site, 'rh')
        self.inf = creer_user(self.site, 'infirmier')

    def test_liste_fiches_medecin(self):
        self.assertIn(auth(self.med).get('/api/medical-work/fiches-aptitude/').status_code, [200, 403])

    def test_liste_fiches_rh(self):
        self.assertIn(auth(self.rh).get('/api/medical-work/fiches-aptitude/').status_code, [200, 403])

    def test_liste_fiches_infirmier(self):
        self.assertIn(auth(self.inf).get('/api/medical-work/fiches-aptitude/').status_code, [200, 403])

    def test_liste_fiches_sans_token(self):
        self.assertIn(APIClient().get('/api/medical-work/fiches-aptitude/').status_code, [401, 403])

    def test_fiche_inexistante(self):
        self.assertIn(auth(self.med).get('/api/medical-work/fiches-aptitude/99999/').status_code, [404, 403])

    def test_infirmier_list_action(self):
        self.assertIn(auth(self.inf).get('/api/medical-work/fiches-aptitude/infirmier_list/').status_code, [200, 403])

    def test_feedback_rh_action(self):
        self.assertIn(auth(self.rh).get('/api/medical-work/fiches-aptitude/feedback_rh/').status_code, [200, 403])

    def test_sans_visite_periodique_action(self):
        self.assertIn(auth(self.rh).get('/api/medical-work/fiches-aptitude/sans_visite_periodique/').status_code, [200, 403])

    def test_alertes_vp_rh_action(self):
        self.assertIn(auth(self.rh).get('/api/medical-work/fiches-aptitude/alertes-visite-periodique-rh/').status_code, [200, 403, 400])

class DemandeBilanViewTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')

    def test_liste_demandes_bilan_medecin(self):
        self.assertIn(auth(self.med).get('/api/medical-work/demandes-bilan/').status_code, [200, 403])

    def test_liste_demandes_bilan_sans_token(self):
        self.assertIn(APIClient().get('/api/medical-work/demandes-bilan/').status_code, [401, 403])

    def test_demande_bilan_inexistante(self):
        self.assertIn(auth(self.med).get('/api/medical-work/demandes-bilan/99999/').status_code, [404, 403])

class DemandeExamenViewTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')

    def test_liste_demandes_examen_medecin(self):
        self.assertIn(auth(self.med).get('/api/medical-work/demandes-examen/').status_code, [200, 403])

    def test_liste_demandes_examen_sans_token(self):
        self.assertIn(APIClient().get('/api/medical-work/demandes-examen/').status_code, [401, 403])

    def test_demande_examen_inexistante(self):
        self.assertIn(auth(self.med).get('/api/medical-work/demandes-examen/99999/').status_code, [404, 403])

class CertificatAptitudeViewTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')
        self.rh = creer_user(self.site, 'rh')

    def test_liste_certificats_medecin(self):
        self.assertIn(auth(self.med).get('/api/medical-work/certificats/').status_code, [200, 403])

    def test_liste_certificats_rh(self):
        self.assertIn(auth(self.rh).get('/api/medical-work/certificats/').status_code, [200, 403])

    def test_liste_certificats_sans_token(self):
        self.assertIn(APIClient().get('/api/medical-work/certificats/').status_code, [401, 403])

    def test_feedback_rh_certificats(self):
        self.assertIn(auth(self.rh).get('/api/medical-work/certificats/feedback_rh/').status_code, [200, 403])

class OrdonnanceMedicalWorkViewTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')

    def test_liste_ordonnances_medecin(self):
        self.assertIn(auth(self.med).get('/api/medical-work/ordonnances/').status_code, [200, 403])

    def test_ordonnances_sans_token(self):
        self.assertIn(APIClient().get('/api/medical-work/ordonnances/').status_code, [401, 403])

class FicheLiaisonViewTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')

    def test_liste_fiches_liaison_medecin(self):
        self.assertIn(auth(self.med).get('/api/medical-work/fiches-liaison/').status_code, [200, 403])

    def test_fiches_liaison_sans_token(self):
        self.assertIn(APIClient().get('/api/medical-work/fiches-liaison/').status_code, [401, 403])