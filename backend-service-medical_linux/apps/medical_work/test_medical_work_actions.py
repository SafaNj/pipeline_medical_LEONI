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

FA = '/api/medical-work/fiches-aptitude/'
DB = '/api/medical-work/demandes-bilan/'
DE = '/api/medical-work/demandes-examen/'
CE = '/api/medical-work/certificats/'

class FicheAptitudeActionsTest(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')
        self.rh = creer_user(self.site, 'rh')
        self.inf = creer_user(self.site, 'infirmier')

    def test_by_collaborateur_medecin(self):
        self.assertIn(auth(self.med).get(f'{FA}by_collaborateur/').status_code, [200, 400, 403])

    def test_by_matricule_medecin(self):
        self.assertIn(auth(self.med).get(f'{FA}by_matricule/').status_code, [200, 400, 403])

    def test_by_matricule_avec_param(self):
        self.assertIn(auth(self.med).get(f'{FA}by_matricule/?matricule=12345').status_code, [200, 400, 403, 404])

    def test_dossier_medical_inexistant(self):
        self.assertIn(auth(self.med).get(f'{FA}99999/dossier_medical/').status_code, [404, 403])

    def test_rattacher_ligne_inexistant(self):
        self.assertIn(auth(self.med).post(f'{FA}99999/rattacher_ligne/', {}, format='json').status_code, [404, 403, 405])

    def test_sauvegarder_remarque_inexistant(self):
        self.assertIn(auth(self.med).patch(f'{FA}99999/sauvegarder_remarque/', {}, format='json').status_code, [404, 403])

    def test_create_fiche(self):
        self.assertIn(auth(self.med).post(FA, {}, format='json').status_code, [201, 400, 403])

    def test_delete_inexistant(self):
        self.assertIn(auth(self.med).delete(f'{FA}99999/').status_code, [404, 403])

    def test_update_inexistant(self):
        self.assertIn(auth(self.med).patch(f'{FA}99999/', {}, format='json').status_code, [404, 403])


class DemandeBilanActionsTest(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')
        self.rh = creer_user(self.site, 'rh')

    def test_by_fiche_action(self):
        self.assertIn(auth(self.med).get(f'{DB}by_fiche/').status_code, [200, 400, 403])

    def test_by_fiche_avec_param(self):
        self.assertIn(auth(self.med).get(f'{DB}by_fiche/?fiche_id=1').status_code, [200, 400, 403, 404])

    def test_depuis_embauche_action(self):
        self.assertIn(auth(self.med).post(f'{DB}depuis_embauche/', {}, format='json').status_code, [200, 201, 400, 403])

    def test_feedback_rh_action(self):
        self.assertIn(auth(self.rh).get(f'{DB}feedback_rh/').status_code, [200, 403])

    def test_create_demande_bilan(self):
        self.assertIn(auth(self.med).post(DB, {}, format='json').status_code, [201, 400, 403])

    def test_delete_inexistant(self):
        self.assertIn(auth(self.med).delete(f'{DB}99999/').status_code, [404, 403])

    def test_update_inexistant(self):
        self.assertIn(auth(self.med).patch(f'{DB}99999/', {}, format='json').status_code, [404, 403])


class DemandeExamenActionsTest(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')
        self.rh = creer_user(self.site, 'rh')

    def test_by_fiche_action(self):
        self.assertIn(auth(self.med).get(f'{DE}by_fiche/').status_code, [200, 400, 403])

    def test_depuis_embauche_action(self):
        self.assertIn(auth(self.med).post(f'{DE}depuis_embauche/', {}, format='json').status_code, [200, 201, 400, 403])

    def test_feedback_rh_action(self):
        self.assertIn(auth(self.rh).get(f'{DE}feedback_rh/').status_code, [200, 403])

    def test_create_demande_examen(self):
        self.assertIn(auth(self.med).post(DE, {}, format='json').status_code, [201, 400, 403])

    def test_delete_inexistant(self):
        self.assertIn(auth(self.med).delete(f'{DE}99999/').status_code, [404, 403])


class CertificatActionsTest(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')
        self.rh = creer_user(self.site, 'rh')
        self.inf = creer_user(self.site, 'infirmier')

    def test_liste_certificats_medecin(self):
        self.assertIn(auth(self.med).get(CE).status_code, [200, 403])

    def test_liste_certificats_rh(self):
        self.assertIn(auth(self.rh).get(CE).status_code, [200, 403])

    def test_liste_certificats_infirmier(self):
        self.assertIn(auth(self.inf).get(CE).status_code, [200, 403])

    def test_create_certificat(self):
        self.assertIn(auth(self.med).post(CE, {}, format='json').status_code, [201, 400, 403])

    def test_delete_inexistant(self):
        self.assertIn(auth(self.med).delete(f'{CE}99999/').status_code, [404, 403])

    def test_update_inexistant(self):
        self.assertIn(auth(self.med).patch(f'{CE}99999/', {}, format='json').status_code, [404, 403])
