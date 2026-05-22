from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework.test import APIClient

from apps.account.models import MedType, Medecin, Profile, Site


class AccountAuthTests(TestCase):
	def setUp(self):
		self.client = APIClient()

	def _make_site(self, code, template_key, nom):
		site, _ = Site.objects.get_or_create(
			code=code,
			defaults={
				'nom': nom,
				'nom_ar': nom,
				'adresse': 'Adresse',
				'telephone': '123',
				'template_key': template_key,
			},
		)
		site.nom = nom
		site.nom_ar = nom
		site.adresse = 'Adresse'
		site.telephone = '123'
		site.template_key = template_key
		site.save()
		return site

	def _make_medecin(self, username, password, site):
		user = User.objects.create_user(username=username, password=password)
		profile, _ = Profile.objects.get_or_create(user=user)
		profile.role = 'medecin'
		profile.phone = '111'
		profile.must_change_password = False
		profile.save()
		med_type, _ = MedType.objects.get_or_create(name='Médecin du Travail')
		medecin, _ = Medecin.objects.get_or_create(
			profile=profile,
			defaults={
				'med_type': med_type,
				'specialite': 'Travail',
				'numero_ordre': username,
				'site': site,
			},
		)
		medecin.med_type = med_type
		medecin.specialite = 'Travail'
		medecin.numero_ordre = username
		medecin.site = site
		medecin.save()
		return user

	def _assert_login_claims(self, response, expected_site):
		self.assertEqual(response.status_code, 200, response.data)
		self.assertEqual(response.data['site_id'], expected_site.id)
		self.assertEqual(response.data['site_nom'], expected_site.nom)
		self.assertEqual(response.data['site_template_key'], expected_site.template_key)

		access = AccessToken(response.data['access'])
		self.assertEqual(access['site_id'], expected_site.id)
		self.assertEqual(access['site_nom'], expected_site.nom)
		self.assertEqual(access['site_template_key'], expected_site.template_key)

	def test_login_menzel_returns_site_claims(self):
		site = self._make_site('MENZEL_HAYET', 'MONASTIR', 'Leoni Menzel Hayet')
		self._make_medecin('doc-menzel', 'pass12345', site)

		response = self.client.post(
			'/api/account/login/',
			{'username': 'doc-menzel', 'password': 'pass12345'},
			format='json',
		)

		self._assert_login_claims(response, site)

	def test_login_messadine_returns_site_claims(self):
		site = self._make_site('MASSADINE', 'SOUSSE', 'Leoni Massadine')
		self._make_medecin('doc-massadine', 'pass12345', site)

		response = self.client.post(
			'/api/account/login/',
			{'username': 'doc-massadine', 'password': 'pass12345'},
			format='json',
		)

		self._assert_login_claims(response, site)

	def test_refresh_returns_site_claims_without_relogin(self):
		site = self._make_site('MASSADINE', 'SOUSSE', 'Leoni Massadine')
		self._make_medecin('doc-refresh', 'pass12345', site)

		login = self.client.post(
			'/api/account/login/',
			{'username': 'doc-refresh', 'password': 'pass12345'},
			format='json',
		)
		self.assertEqual(login.status_code, 200, login.data)

		refresh = self.client.post(
			'/api/account/refresh/',
			{'refresh': login.data['refresh']},
			format='json',
		)

		self.assertEqual(refresh.status_code, 200, refresh.data)
		self.assertIn('access', refresh.data)
		self.assertIn('refresh', refresh.data)
		self.assertEqual(refresh.data['site_id'], site.id)
		self.assertEqual(refresh.data['site_nom'], site.nom)
		self.assertEqual(refresh.data['site_template_key'], site.template_key)

		access = AccessToken(refresh.data['access'])
		self.assertEqual(access['site_id'], site.id)
		self.assertEqual(access['site_nom'], site.nom)
		self.assertEqual(access['site_template_key'], site.template_key)
