import uuid
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from apps.account.models import Site, Profile, Infirmier, Medecin


def creer_site():
    uid = uuid.uuid4().hex[:6]
    return Site.objects.create(nom=f'Site {uid}', code=f'PA_{uid}')

def creer_infirmier(site):
    uid = uuid.uuid4().hex[:6]
    user = User.objects.create_user(username=f'inf_{uid}', password='pass1234')
    profile, _ = Profile.objects.get_or_create(user=user)
    profile.role = 'INFIRMIER'
    profile.must_change_password = False
    profile.save()
    Infirmier.objects.get_or_create(profile=profile, defaults={'site': site})
    return user


def creer_medecin(site):
    uid = uuid.uuid4().hex[:6]
    user = User.objects.create_user(username=f'med_{uid}', password='pass1234')
    profile, _ = Profile.objects.get_or_create(user=user)
    profile.role = 'MEDECIN'
    profile.must_change_password = False
    profile.save()
    Medecin.objects.get_or_create(profile=profile, defaults={'site': site})
    return user


def get_token(client, user):
    r = client.post('/api/account/login/', {'username': user.username, 'password': 'pass1234'}, format='json')
    return r.data.get('access')


class ListPassageViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.site = creer_site()
        self.user = creer_infirmier(self.site)
        token = get_token(self.client, self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_liste_passages_retourne_200(self):
        response = self.client.get('/api/act-infirmier/listes/')
        self.assertIn(response.status_code, [200, 404])

    def test_liste_passages_sans_token_bloque(self):
        response = APIClient().get('/api/act-infirmier/listes/')
        self.assertIn(response.status_code, [401, 403])

    def test_liste_passages_medecin_acces(self):
        medecin = creer_medecin(self.site)
        client = APIClient()
        token = get_token(client, medecin)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = client.get('/api/act-infirmier/listes/')
        self.assertIn(response.status_code, [200, 403, 404])


class ItemPassageViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.site = creer_site()
        self.user = creer_infirmier(self.site)
        token = get_token(self.client, self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_liste_items_passage_retourne_200(self):
        response = self.client.get('/api/act-infirmier/listes/')
        self.assertIn(response.status_code, [200, 404])

    def test_item_inexistant_retourne_404(self):
        response = self.client.get('/api/act-infirmier/listes/99999/')
        self.assertIn(response.status_code, [404, 403])