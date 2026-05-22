import uuid
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient
from apps.account.models import Infirmier, MedType, Medecin, Profile, RH, Site

# ── Vraies URLs issues de apps/employees/urls.py ─────────────────────────────
# router.register(r"collaborateurs", CollaborateurViewSet, ...)
# → /api/employees/collaborateurs/
# Action : recherche_im (detail=False, GET)

BASE_EMP = '/api/employees/collaborateurs/'


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


class CollaborateurViewTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')
        self.rh  = creer_user(self.site, 'rh')
        self.inf = creer_user(self.site, 'infirmier')

    def test_liste_collaborateurs_medecin(self):
        self.assertIn(auth(self.med).get(BASE_EMP).status_code, [200, 403])

    def test_liste_collaborateurs_rh(self):
        self.assertIn(auth(self.rh).get(BASE_EMP).status_code, [200, 403])

    def test_liste_collaborateurs_infirmier(self):
        self.assertIn(auth(self.inf).get(BASE_EMP).status_code, [200, 403])

    def test_liste_collaborateurs_sans_token(self):
        self.assertIn(APIClient().get(BASE_EMP).status_code, [401, 403])

    def test_collaborateur_inexistant(self):
        self.assertIn(auth(self.med).get(f'{BASE_EMP}99999/').status_code, [404, 403])

    def test_collaborateur_search(self):
        self.assertIn(
            auth(self.med).get(f'{BASE_EMP}?search=test').status_code,
            [200, 403])

    def test_collaborateur_filter_site(self):
        self.assertIn(
            auth(self.med).get(f'{BASE_EMP}?site={self.site.pk}').status_code,
            [200, 403])

    def test_recherche_im_medecin(self):
        self.assertIn(
            auth(self.med).get(f'{BASE_EMP}recherche_im/').status_code,
            [200, 400, 403])

    def test_recherche_im_rh(self):
        self.assertIn(
            auth(self.rh).get(f'{BASE_EMP}recherche_im/').status_code,
            [200, 400, 403])

    def test_recherche_im_sans_token(self):
        self.assertIn(
            APIClient().get(f'{BASE_EMP}recherche_im/').status_code,
            [401, 403])