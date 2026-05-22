"""
Tests RBAC — Plateforme médicale LEONI
Vérifie que chaque rôle n'accède qu'à ses ressources autorisées.
"""
from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from apps.account.models import Profile, Site, MedType, Medecin


class RBACTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.site = Site.objects.get_or_create(
            code='RBAC_TEST',
            defaults={
                'nom': 'Site RBAC', 'nom_ar': 'موقع',
                'adresse': 'Addr', 'telephone': '000',
                'template_key': 'MONASTIR'
            }
        )[0]

    def _make_user(self, username, role):
        """Crée un utilisateur avec un rôle donné."""
        user = User.objects.create_user(
            username=username, password='TestPass2026!'
        )
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.role = role
        profile.must_change_password = False
        profile.save()
        if role == 'medecin':
            med_type, _ = MedType.objects.get_or_create(
                name='Médecin du Travail'
            )
            Medecin.objects.get_or_create(
                profile=profile,
                defaults={
                    'med_type': med_type, 'specialite': 'Travail',
                    'numero_ordre': username, 'site': self.site
                }
            )
        return user

    def _login_as(self, username):
        """Se connecte et configure le client avec le token."""
        resp = self.client.post('/api/account/login/', {
            'username': username,
            'password': 'TestPass2026!'
        }, format='json')
        if resp.status_code == 200:
            token = resp.data.get('access', '')
            self.client.credentials(
                HTTP_AUTHORIZATION=f'Bearer {token}'
            )

    def test_infirmier_acces_listes_autorise(self):
        """Infirmier peut accéder aux listes de passage."""
        self._make_user('inf_rbac', 'infirmier')
        self._login_as('inf_rbac')
        r = self.client.get('/api/act-infirmier/listes/')
        self.assertIn(r.status_code, [200, 404])

    def test_infirmier_acces_stock_autorise(self):
        """Infirmier peut accéder au stock de médicaments."""
        self._make_user('inf_stock', 'infirmier')
        self._login_as('inf_stock')
        r = self.client.get('/api/stock/medicaments/')
        self.assertIn(r.status_code, [200, 404])

    def test_acces_sans_token_bloque(self):
        """Sans token JWT, tout accès est refusé."""
        self.client.credentials()
        for endpoint in [
            '/api/act-infirmier/listes/',
            '/api/stock/medicaments/',
            '/api/consultations/',
        ]:
            r = self.client.get(endpoint)
            self.assertEqual(r.status_code, 401,
                f"Endpoint {endpoint} devrait retourner 401 sans token")

    def test_must_change_password_bloque(self):
        """Un utilisateur qui doit changer son mdp ne peut pas accéder."""
        user = self._make_user('force_change', 'infirmier')
        Profile.objects.filter(user=user).update(must_change_password=True)
        self._login_as('force_change')
        r = self.client.get('/api/act-infirmier/listes/')
        self.assertEqual(r.status_code, 403)