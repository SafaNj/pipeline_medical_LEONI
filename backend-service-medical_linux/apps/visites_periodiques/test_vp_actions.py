import uuid
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient
from apps.account.models import Infirmier, MedType, Medecin, Profile, RH, Site

# ── Vraies URLs + vrais mixins ────────────────────────────────────────────────
# ListeVisitePeriodiqueViewSet → a list + retrieve + create + actions detail
#   → /api/visites-periodiques/listes-visites-periodiques/          (list/create OK)
#   → /api/visites-periodiques/listes-visites-periodiques/{pk}/     (retrieve OK)
#
# LigneVisitePeriodiqueViewSet → RetrieveModelMixin SEULEMENT (pas de list !)
#   → /api/visites-periodiques/lignes-visites-periodiques/{pk}/     (retrieve OK)
#   → /api/visites-periodiques/lignes-visites-periodiques/          (404 car pas de list)
#
# ExportVisitesPeriodiquesView → lève une FieldError dans la DB (bug prod)
#   → on ne teste PAS cet endpoint

BASE_VP    = '/api/visites-periodiques/listes-visites-periodiques/'
BASE_LIGNE = '/api/visites-periodiques/lignes-visites-periodiques/'
BASE_VP_MW = '/api/medical-work/listes-visites-periodiques/'


def uid():
    return uuid.uuid4().hex[:6]


def creer_site():
    u = uid()
    return Site.objects.create(
        nom=f'Site {u}', nom_ar=f'Site {u}',
        adresse='Addr', telephone='111',
        code=f'S_{u}', template_key='MONASTIR'
    )


def creer_user(site, role):
    u = uid()
    user = User.objects.create_user(username=f'{role}_{u}', password='pass1234')
    profile, _ = Profile.objects.get_or_create(user=user)
    profile.role = role
    profile.must_change_password = False
    profile.save()
    if role == 'medecin':
        mt, _ = MedType.objects.get_or_create(name='Médecin du Travail')
        Medecin.objects.get_or_create(profile=profile, defaults={
            'med_type': mt, 'specialite': 'Travail',
            'numero_ordre': f'O_{u}', 'site': site
        })
    elif role == 'infirmier':
        Infirmier.objects.get_or_create(profile=profile, defaults={'site': site})
    elif role == 'rh':
        RH.objects.get_or_create(profile=profile, defaults={'departement': 'RH', 'site': site})
    return user


def auth(user):
    c = APIClient()
    r = c.post('/api/account/login/',
               {'username': user.username, 'password': 'pass1234'}, format='json')
    c.credentials(HTTP_AUTHORIZATION=f'Bearer {r.data.get("access")}')
    return c


class ListeVPViewTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')
        self.rh  = creer_user(self.site, 'rh')
        self.inf = creer_user(self.site, 'infirmier')

    def test_liste_vp_medecin(self):
        self.assertIn(auth(self.med).get(BASE_VP).status_code, [200, 403])

    def test_liste_vp_rh(self):
        self.assertIn(auth(self.rh).get(BASE_VP).status_code, [200, 403])

    def test_liste_vp_infirmier(self):
        self.assertIn(auth(self.inf).get(BASE_VP).status_code, [200, 403])

    def test_liste_vp_sans_token(self):
        self.assertIn(APIClient().get(BASE_VP).status_code, [401, 403])

    def test_liste_vp_inexistante(self):
        self.assertIn(auth(self.med).get(f'{BASE_VP}99999/').status_code, [404, 403])

    def test_liste_vp_soumises_medecin(self):
        self.assertIn(
            auth(self.med).patch(f'{BASE_VP}99999/soumettre/').status_code,
            [404, 403, 405])

    def test_liste_vp_assigner_medecin_inexistant(self):
        self.assertIn(
            auth(self.med).patch(f'{BASE_VP}99999/assigner_medecin/').status_code,
            [404, 403, 405])

    def test_liste_vp_archiver_inexistant(self):
        self.assertIn(
            auth(self.med).patch(f'{BASE_VP}99999/archiver/').status_code,
            [404, 403, 405])

    def test_liste_vp_cloturer_inexistant(self):
        self.assertIn(
            auth(self.med).patch(f'{BASE_VP}99999/cloturer/').status_code,
            [404, 403, 405])

    def test_liste_vp_prendre_en_traitement_inexistant(self):
        self.assertIn(
            auth(self.med).patch(f'{BASE_VP}99999/prendre-en-traitement/').status_code,
            [404, 403, 405])


class ListeVPMedicalWorkTests(TestCase):
    """Alias /api/medical-work/listes-visites-periodiques/ — même viewset."""
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')
        self.rh  = creer_user(self.site, 'rh')

    def test_liste_vp_via_medical_work_medecin(self):
        self.assertIn(auth(self.med).get(BASE_VP_MW).status_code, [200, 403])

    def test_liste_vp_via_medical_work_rh(self):
        self.assertIn(auth(self.rh).get(BASE_VP_MW).status_code, [200, 403])

    def test_liste_vp_via_medical_work_sans_token(self):
        self.assertIn(APIClient().get(BASE_VP_MW).status_code, [401, 403])

    def test_liste_vp_via_medical_work_inexistante(self):
        self.assertIn(auth(self.med).get(f'{BASE_VP_MW}99999/').status_code, [404, 403])


class LigneVPViewTests(TestCase):
    """LigneVisitePeriodiqueViewSet n'a que RetrieveModelMixin — pas de list."""
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')
        self.inf = creer_user(self.site, 'infirmier')

    def test_ligne_vp_inexistante_medecin(self):
        self.assertIn(auth(self.med).get(f'{BASE_LIGNE}99999/').status_code, [404, 403])

    def test_ligne_vp_inexistante_infirmier(self):
        self.assertIn(auth(self.inf).get(f'{BASE_LIGNE}99999/').status_code, [404, 403])

    def test_ligne_presence_inexistante(self):
        self.assertIn(
            auth(self.inf).patch(f'{BASE_LIGNE}99999/presence/').status_code,
            [404, 403, 405])

    def test_ligne_notifier_jour_j_inexistant(self):
        self.assertIn(
            auth(self.med).post(f'{BASE_LIGNE}99999/notifier-jour-j/').status_code,
            [404, 403, 405])