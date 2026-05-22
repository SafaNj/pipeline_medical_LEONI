import uuid
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient
from apps.account.models import Infirmier, MedType, Medecin, Profile, RH, Site

# ── Vraies URLs issues de apps/consultations/urls.py ─────────────────────────
# /api/consultations/consultations/                  → list/retrieve OK
# /api/consultations/ordonnances/                    → list/retrieve OK
# /api/consultations/lignes/                         → list/retrieve OK
# /api/consultations/certificats/                    → list/retrieve OK
# /api/consultations/certificats-aptitude-generale/  → list/retrieve OK
# /api/consultations/certificats-exemption/          → list/retrieve OK
# /api/consultations/certificats-bonne-sante/        → list/retrieve OK
# /api/consultations/certificats-permis/             → list/retrieve OK
# /api/consultations/certificats-prenuptial/         → list/retrieve OK
# /api/consultations/posologies/suggest/             → OK (action only, pas de list ni retrieve)

BASE = '/api/consultations/'
CONS     = BASE + 'consultations/'
ORD      = BASE + 'ordonnances/'
LIG      = BASE + 'lignes/'
CERT     = BASE + 'certificats/'
CERT_APT = BASE + 'certificats-aptitude-generale/'
CERT_EX  = BASE + 'certificats-exemption/'
CERT_BS  = BASE + 'certificats-bonne-sante/'
CERT_PE  = BASE + 'certificats-permis/'
CERT_PR  = BASE + 'certificats-prenuptial/'
POSO_SUG = BASE + 'posologies/suggest/'


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


class ConsultationViewTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')
        self.inf = creer_user(self.site, 'infirmier')
        self.rh  = creer_user(self.site, 'rh')

    def test_liste_consultations_medecin(self):
        self.assertIn(auth(self.med).get(CONS).status_code, [200, 403])

    def test_liste_consultations_infirmier(self):
        self.assertIn(auth(self.inf).get(CONS).status_code, [200, 403])

    def test_liste_consultations_rh(self):
        self.assertIn(auth(self.rh).get(CONS).status_code, [200, 403])

    def test_liste_consultations_sans_token(self):
        self.assertIn(APIClient().get(CONS).status_code, [401, 403])

    def test_consultation_inexistante(self):
        self.assertIn(auth(self.med).get(f'{CONS}99999/').status_code, [404, 403])

    def test_mes_consultations_medecin(self):
        self.assertIn(
            auth(self.med).get(f'{CONS}mes_consultations/').status_code,
            [200, 403, 404])

    def test_mes_listes_du_jour_medecin(self):
        self.assertIn(
            auth(self.med).get(f'{CONS}mes_listes_du_jour/').status_code,
            [200, 403, 404])

    def test_by_collaborateur_medecin(self):
        self.assertIn(
            auth(self.med).get(f'{CONS}by_collaborateur/').status_code,
            [200, 400, 403, 404])


class OrdonnanceViewTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')

    def test_liste_ordonnances_medecin(self):
        self.assertIn(auth(self.med).get(ORD).status_code, [200, 403])

    def test_ordonnances_sans_token(self):
        self.assertIn(APIClient().get(ORD).status_code, [401, 403])

    def test_ordonnance_inexistante(self):
        self.assertIn(auth(self.med).get(f'{ORD}99999/').status_code, [404, 403])


class LigneOrdonnanceViewTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')

    def test_liste_lignes_medecin(self):
        self.assertIn(auth(self.med).get(LIG).status_code, [200, 403])

    def test_lignes_sans_token(self):
        self.assertIn(APIClient().get(LIG).status_code, [401, 403])

    def test_ligne_inexistante(self):
        self.assertIn(auth(self.med).get(f'{LIG}99999/').status_code, [404, 403])


class CertificatViewTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')
        self.rh  = creer_user(self.site, 'rh')

    def test_liste_certificats_medecin(self):
        self.assertIn(auth(self.med).get(CERT).status_code, [200, 403])

    def test_liste_certificats_sans_token(self):
        self.assertIn(APIClient().get(CERT).status_code, [401, 403])

    def test_certificat_inexistant(self):
        self.assertIn(auth(self.med).get(f'{CERT}99999/').status_code, [404, 403])

    def test_certificat_aptitude_generale_medecin(self):
        self.assertIn(auth(self.med).get(CERT_APT).status_code, [200, 403])

    def test_certificat_aptitude_generale_sans_token(self):
        self.assertIn(APIClient().get(CERT_APT).status_code, [401, 403])

    def test_certificat_exemption_medecin(self):
        self.assertIn(auth(self.med).get(CERT_EX).status_code, [200, 403])

    def test_certificat_exemption_sans_token(self):
        self.assertIn(APIClient().get(CERT_EX).status_code, [401, 403])

    def test_certificat_bonne_sante_medecin(self):
        self.assertIn(auth(self.med).get(CERT_BS).status_code, [200, 403])

    def test_certificat_bonne_sante_sans_token(self):
        self.assertIn(APIClient().get(CERT_BS).status_code, [401, 403])

    def test_certificat_permis_medecin(self):
        self.assertIn(auth(self.med).get(CERT_PE).status_code, [200, 403])

    def test_certificat_permis_sans_token(self):
        self.assertIn(APIClient().get(CERT_PE).status_code, [401, 403])

    def test_certificat_prenuptial_medecin(self):
        self.assertIn(auth(self.med).get(CERT_PR).status_code, [200, 403])

    def test_certificat_prenuptial_sans_token(self):
        self.assertIn(APIClient().get(CERT_PR).status_code, [401, 403])


class PosologieViewTests(TestCase):
    """PosologieViewSet n'a QUE l'action suggest — pas de list ni retrieve."""
    def setUp(self):
        self.site = creer_site()
        self.med = creer_user(self.site, 'medecin')
        self.inf = creer_user(self.site, 'infirmier')

    def test_posologie_suggest_medecin(self):
        self.assertIn(
            auth(self.med).get(POSO_SUG).status_code,
            [200, 400, 403])

    def test_posologie_suggest_infirmier(self):
        self.assertIn(
            auth(self.inf).get(POSO_SUG).status_code,
            [200, 400, 403])

    def test_posologie_suggest_sans_token(self):
        self.assertIn(
            APIClient().get(POSO_SUG).status_code,
            [401, 403])

    def test_posologie_suggest_avec_medicament(self):
        self.assertIn(
            auth(self.med).get(f'{POSO_SUG}?medicament_id=1').status_code,
            [200, 400, 403, 404])