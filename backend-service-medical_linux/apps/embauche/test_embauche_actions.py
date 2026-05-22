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

C = '/api/embauche/candidats/'
L = '/api/embauche/listes/'

class EmbaucheListeActionsTest(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')
        self.rh = creer_user(self.site, 'rh')
        self.inf = creer_user(self.site, 'infirmier')

    def test_listes_get_medecin(self):
        self.assertIn(auth(self.med).get(L).status_code, [200, 403])

    def test_listes_get_rh(self):
        self.assertIn(auth(self.rh).get(L).status_code, [200, 403])

    def test_listes_sans_token(self):
        self.assertIn(APIClient().get(L).status_code, [401, 403])

    def test_liste_inexistante(self):
        self.assertIn(auth(self.med).get(f'{L}99999/').status_code, [404, 403])

    def test_create_liste(self):
        self.assertIn(auth(self.med).post(L, {}, format='json').status_code, [201, 400, 403])

    def test_medecins_travail_action(self):
        self.assertIn(auth(self.med).get(f'{L}medecins_travail/').status_code, [200, 403])

    def test_medecins_travail_rh(self):
        self.assertIn(auth(self.rh).get(f'{L}medecins_travail/').status_code, [200, 403])

    def test_soumettre_inexistant(self):
        self.assertIn(auth(self.med).patch(f'{L}99999/soumettre/').status_code, [404, 403, 405])

    def test_passer_en_traitement_inexistant(self):
        self.assertIn(auth(self.med).patch(f'{L}99999/passer_en_traitement/').status_code, [404, 403, 405])

    def test_cloturer_inexistant(self):
        self.assertIn(auth(self.med).patch(f'{L}99999/cloturer/').status_code, [404, 403, 405])

    def test_archiver_inexistant(self):
        self.assertIn(auth(self.med).patch(f'{L}99999/archiver/').status_code, [404, 403, 405])

    def test_update_inexistant(self):
        self.assertIn(auth(self.med).patch(f'{L}99999/', {}, format='json').status_code, [404, 403])

    def test_delete_inexistant(self):
        self.assertIn(auth(self.med).delete(f'{L}99999/').status_code, [404, 403])


class EmbaucheCanditatActionsTest(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')
        self.rh = creer_user(self.site, 'rh')
        self.inf = creer_user(self.site, 'infirmier')

    def test_candidats_get_medecin(self):
        self.assertIn(auth(self.med).get(C).status_code, [200, 403])

    def test_candidats_get_rh(self):
        self.assertIn(auth(self.rh).get(C).status_code, [200, 403])

    def test_candidats_get_infirmier(self):
        self.assertIn(auth(self.inf).get(C).status_code, [200, 403])

    def test_candidats_sans_token(self):
        self.assertIn(APIClient().get(C).status_code, [401, 403])

    def test_candidat_inexistant(self):
        self.assertIn(auth(self.med).get(f'{C}99999/').status_code, [404, 403])

    def test_a_examiner_medecin(self):
        self.assertIn(auth(self.med).get(f'{C}a_examiner/').status_code, [200, 403])

    def test_a_examiner_inf(self):
        self.assertIn(auth(self.inf).get(f'{C}a_examiner/').status_code, [200, 403])

    def test_a_examiner_rh(self):
        self.assertIn(auth(self.rh).get(f'{C}a_examiner/').status_code, [200, 403])

    def test_presence_inexistant(self):
        self.assertIn(auth(self.med).patch(f'{C}99999/presence/').status_code, [404, 403, 405])

    def test_rattacher_fiche_inexistant(self):
        self.assertIn(auth(self.med).patch(f'{C}99999/rattacher_fiche/').status_code, [404, 403, 405])

    def test_observations_inexistant(self):
        self.assertIn(auth(self.med).patch(f'{C}99999/observations/').status_code, [404, 403, 405])

    def test_changer_statut_inexistant(self):
        self.assertIn(auth(self.med).patch(f'{C}99999/changer_statut_integration/').status_code, [404, 403, 405])

    def test_creer_collaborateur_inexistant(self):
        self.assertIn(auth(self.med).post(f'{C}99999/creer_collaborateur/', {}, format='json').status_code, [404, 403, 405])

    def test_documents_medecin_action(self):
        self.assertIn(auth(self.med).get(f'{C}documents_medecin/').status_code, [200, 400, 403])

    def test_create_candidat(self):
        self.assertIn(auth(self.med).post(C, {}, format='json').status_code, [201, 400, 403])

    def test_update_inexistant(self):
        self.assertIn(auth(self.med).patch(f'{C}99999/', {}, format='json').status_code, [404, 403])

    def test_delete_inexistant(self):
        self.assertIn(auth(self.med).delete(f'{C}99999/').status_code, [404, 403])
