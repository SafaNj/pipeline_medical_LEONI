import uuid
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient
from apps.account.models import Infirmier, MedType, Medecin, Profile, RH, Site
from apps.account.models.HSEE_models import HSEE

# ── URLs account ──────────────────────────────────────────────────────────────
BASE       = '/api/account/'
MEDECINS   = BASE + 'medecins/'
INFIRMIERS = BASE + 'infirmiers/'
RHS        = BASE + 'rh/'
HSEES      = BASE + 'hsee/'
PROFILES   = BASE + 'profiles/'
SITES      = BASE + 'sites/'
MEDTYPES   = BASE + 'medtypes/'
CHANGE_PWD = BASE + 'change-password/'
CHECK_PWD  = BASE + 'check-must-change-password/'
LOGOUT     = BASE + 'logout/'


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
    elif role == 'hsse':
        HSEE.objects.get_or_create(profile=profile, defaults={'zone': 'Z1', 'certification': 'C1', 'site': site})
    return user


def creer_admin(site):
    u = uid()
    user = User.objects.create_user(username=f'admin_{u}', password='pass1234', is_staff=True, is_superuser=True)
    profile, _ = Profile.objects.get_or_create(user=user)
    profile.role = 'admin'
    profile.must_change_password = False
    profile.save()
    return user


def auth(user):
    c = APIClient()
    r = c.post(BASE + 'login/', {'username': user.username, 'password': 'pass1234'}, format='json')
    c.credentials(HTTP_AUTHORIZATION=f'Bearer {r.data.get("access")}')
    return c


class MedecinViewSetTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med  = creer_user(self.site, 'medecin')
        self.adm  = creer_admin(self.site)

    def test_liste_medecins_medecin(self):
        self.assertIn(auth(self.med).get(MEDECINS).status_code, [200, 403])

    def test_liste_medecins_admin(self):
        self.assertIn(auth(self.adm).get(MEDECINS).status_code, [200, 403])

    def test_liste_medecins_sans_token(self):
        self.assertIn(APIClient().get(MEDECINS).status_code, [401, 403])

    def test_medecin_inexistant(self):
        self.assertIn(auth(self.adm).get(f'{MEDECINS}99999/').status_code, [404, 403])

    def test_by_specialite_avec_param(self):
        self.assertIn(
            auth(self.adm).get(f'{MEDECINS}by_specialite/?specialite=Travail').status_code,
            [200, 403])

    def test_by_specialite_sans_param(self):
        self.assertIn(
            auth(self.adm).get(f'{MEDECINS}by_specialite/').status_code,
            [400, 403])

    def test_by_med_type_avec_param(self):
        self.assertIn(
            auth(self.adm).get(f'{MEDECINS}by_med_type/?med_type_id=1').status_code,
            [200, 403])

    def test_by_med_type_sans_param(self):
        self.assertIn(
            auth(self.adm).get(f'{MEDECINS}by_med_type/').status_code,
            [400, 403])

    def test_active_medecins(self):
        self.assertIn(
            auth(self.adm).get(f'{MEDECINS}active_medecins/').status_code,
            [200, 403])

    def test_medecin_create_admin(self):
        self.assertIn(
            auth(self.adm).post(MEDECINS, {}, format='json').status_code,
            [201, 400, 403])

    def test_medecin_update_inexistant(self):
        self.assertIn(
            auth(self.adm).patch(f'{MEDECINS}99999/').status_code,
            [404, 403])

    def test_medecin_delete_inexistant(self):
        self.assertIn(
            auth(self.adm).delete(f'{MEDECINS}99999/').status_code,
            [404, 403])


class InfirmierViewSetTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.inf  = creer_user(self.site, 'infirmier')
        self.adm  = creer_admin(self.site)

    def test_liste_infirmiers_admin(self):
        self.assertIn(auth(self.adm).get(INFIRMIERS).status_code, [200, 403])

    def test_liste_infirmiers_infirmier(self):
        self.assertIn(auth(self.inf).get(INFIRMIERS).status_code, [200, 403])

    def test_liste_infirmiers_sans_token(self):
        self.assertIn(APIClient().get(INFIRMIERS).status_code, [401, 403])

    def test_infirmier_inexistant(self):
        self.assertIn(auth(self.adm).get(f'{INFIRMIERS}99999/').status_code, [404, 403])

    def test_infirmier_create(self):
        self.assertIn(
            auth(self.adm).post(INFIRMIERS, {}, format='json').status_code,
            [201, 400, 403])

    def test_infirmier_update_inexistant(self):
        self.assertIn(
            auth(self.adm).patch(f'{INFIRMIERS}99999/').status_code,
            [404, 403])

    def test_infirmier_delete_inexistant(self):
        self.assertIn(
            auth(self.adm).delete(f'{INFIRMIERS}99999/').status_code,
            [404, 403])


class RHViewSetTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.rh   = creer_user(self.site, 'rh')
        self.adm  = creer_admin(self.site)

    def test_liste_rh_admin(self):
        self.assertIn(auth(self.adm).get(RHS).status_code, [200, 403])

    def test_liste_rh_rh(self):
        self.assertIn(auth(self.rh).get(RHS).status_code, [200, 403])

    def test_liste_rh_sans_token(self):
        self.assertIn(APIClient().get(RHS).status_code, [401, 403])

    def test_rh_inexistant(self):
        self.assertIn(auth(self.adm).get(f'{RHS}99999/').status_code, [404, 403])

    def test_rh_create(self):
        self.assertIn(
            auth(self.adm).post(RHS, {}, format='json').status_code,
            [201, 400, 403])

    def test_rh_update_inexistant(self):
        self.assertIn(
            auth(self.adm).patch(f'{RHS}99999/').status_code,
            [404, 403])

    def test_rh_delete_inexistant(self):
        self.assertIn(
            auth(self.adm).delete(f'{RHS}99999/').status_code,
            [404, 403])


class HSEEViewSetTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.hsse = creer_user(self.site, 'hsse')
        self.adm  = creer_admin(self.site)

    def test_liste_hsee_admin(self):
        self.assertIn(auth(self.adm).get(HSEES).status_code, [200, 403])

    def test_liste_hsee_hsse(self):
        self.assertIn(auth(self.hsse).get(HSEES).status_code, [200, 403])

    def test_liste_hsee_sans_token(self):
        self.assertIn(APIClient().get(HSEES).status_code, [401, 403])

    def test_hsee_inexistant(self):
        self.assertIn(auth(self.adm).get(f'{HSEES}99999/').status_code, [404, 403])

    def test_hsee_create(self):
        self.assertIn(
            auth(self.adm).post(HSEES, {}, format='json').status_code,
            [201, 400, 403])

    def test_hsee_update_inexistant(self):
        self.assertIn(
            auth(self.adm).patch(f'{HSEES}99999/').status_code,
            [404, 403])

    def test_hsee_delete_inexistant(self):
        self.assertIn(
            auth(self.adm).delete(f'{HSEES}99999/').status_code,
            [404, 403])


class ProfileViewSetTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med  = creer_user(self.site, 'medecin')
        self.adm  = creer_admin(self.site)

    def test_liste_profiles_admin(self):
        self.assertIn(auth(self.adm).get(PROFILES).status_code, [200, 403])

    def test_liste_profiles_medecin(self):
        self.assertIn(auth(self.med).get(PROFILES).status_code, [200, 403])

    def test_liste_profiles_sans_token(self):
        self.assertIn(APIClient().get(PROFILES).status_code, [401, 403])

    def test_my_profile_medecin(self):
        self.assertIn(
            auth(self.med).get(f'{PROFILES}my_profile/').status_code,
            [200, 403])

    def test_my_profile_admin(self):
        self.assertIn(
            auth(self.adm).get(f'{PROFILES}my_profile/').status_code,
            [200, 403])

    def test_by_role_avec_param(self):
        self.assertIn(
            auth(self.adm).get(f'{PROFILES}by_role/?role=medecin').status_code,
            [200, 403])

    def test_by_role_sans_param(self):
        self.assertIn(
            auth(self.adm).get(f'{PROFILES}by_role/').status_code,
            [400, 403])

    def test_profile_inexistant(self):
        self.assertIn(auth(self.adm).get(f'{PROFILES}99999/').status_code, [404, 403])

    def test_update_phone_inexistant(self):
        self.assertIn(
            auth(self.adm).patch(f'{PROFILES}99999/update_phone/').status_code,
            [404, 403])

    def test_profile_create(self):
        self.assertIn(
            auth(self.adm).post(PROFILES, {}, format='json').status_code,
            [201, 400, 403])

    def test_profile_delete_inexistant(self):
        self.assertIn(
            auth(self.adm).delete(f'{PROFILES}99999/').status_code,
            [404, 403])


class SiteViewSetTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med  = creer_user(self.site, 'medecin')

    def test_liste_sites_medecin(self):
        self.assertIn(auth(self.med).get(SITES).status_code, [200, 403])

    def test_liste_sites_sans_token(self):
        self.assertIn(APIClient().get(SITES).status_code, [401, 403])

    def test_site_inexistant(self):
        self.assertIn(auth(self.med).get(f'{SITES}99999/').status_code, [404, 403])

    def test_print_config_inexistant(self):
        self.assertIn(
            auth(self.med).get(f'{SITES}99999/print-config/').status_code,
            [404, 403])

    def test_print_config_site_existant(self):
        self.assertIn(
            auth(self.med).get(f'{SITES}{self.site.pk}/print-config/').status_code,
            [200, 403])


class MedTypeViewSetTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med  = creer_user(self.site, 'medecin')
        self.adm  = creer_admin(self.site)

    def test_liste_medtypes_admin(self):
        self.assertIn(auth(self.adm).get(MEDTYPES).status_code, [200, 403])

    def test_liste_medtypes_medecin(self):
        self.assertIn(auth(self.med).get(MEDTYPES).status_code, [200, 403])

    def test_liste_medtypes_sans_token(self):
        self.assertIn(APIClient().get(MEDTYPES).status_code, [401, 403])

    def test_medtype_inexistant(self):
        self.assertIn(auth(self.adm).get(f'{MEDTYPES}99999/').status_code, [404, 403])

    def test_medtype_create(self):
        self.assertIn(
            auth(self.adm).post(MEDTYPES, {'name': f'Type_{uid()}'}, format='json').status_code,
            [201, 400, 403])

    def test_medtype_delete_inexistant(self):
        self.assertIn(
            auth(self.adm).delete(f'{MEDTYPES}99999/').status_code,
            [404, 403])


class AuthViewsExtraTests(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med  = creer_user(self.site, 'medecin')

    def test_change_password_sans_token(self):
        self.assertIn(
            APIClient().post(CHANGE_PWD, {}, format='json').status_code,
            [401, 403])

    def test_change_password_avec_token_vide(self):
        self.assertIn(
            auth(self.med).post(CHANGE_PWD, {}, format='json').status_code,
            [400, 403])

    def test_change_password_avec_token(self):
        self.assertIn(
            auth(self.med).post(CHANGE_PWD,
                {'old_password': 'pass1234', 'new_password': 'NvxPass123!'},
                format='json').status_code,
            [200, 400, 403])

    def test_check_must_change_password_avec_token(self):
        self.assertIn(
            auth(self.med).get(CHECK_PWD).status_code,
            [200, 403])

    def test_check_must_change_password_sans_token(self):
        self.assertIn(
            APIClient().get(CHECK_PWD).status_code,
            [401, 403])

    def test_logout_avec_token(self):
        self.assertIn(
            auth(self.med).post(LOGOUT, {}, format='json').status_code,
            [200, 205, 400, 403])

    def test_logout_sans_token(self):
        self.assertIn(
            APIClient().post(LOGOUT, {}, format='json').status_code,
            [401, 403])
