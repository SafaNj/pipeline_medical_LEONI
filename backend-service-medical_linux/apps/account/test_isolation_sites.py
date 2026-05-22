import uuid
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from apps.account.models import Site, Medecin, Profile
from apps.medical_records.models import DossierMedical


class IsolationMultiSiteTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        uid = uuid.uuid4().hex[:8]

        # ── 1. Créer deux sites ───────────────────────────────────────────────
        self.site_menzel = Site.objects.create(
            nom=f'Menzel Test {uid}',
            code=f'MNZ_{uid}'
        )
        self.site_massadine = Site.objects.create(
            nom=f'Massadine Test {uid}',
            code=f'MSS_{uid}'
        )

        # ── 2. Médecin Menzel ─────────────────────────────────────────────────
        self.user_menzel = User.objects.create_user(
            username=f'mnz_{uid}',
            password='pass1234'
        )

        # get_or_create : au cas où un signal post_save a déjà créé le Profile
        self.profile_menzel, _ = Profile.objects.get_or_create(
            user=self.user_menzel,
            defaults={
                'role': 'medecin',
                'must_change_password': False
            }
        )
        # S'assurer que les champs sont bien à jour même si déjà existant
        self.profile_menzel.role = 'medecin'
        self.profile_menzel.must_change_password = False
        self.profile_menzel.save()

        # get_or_create : au cas où un signal post_save a déjà créé le Medecin
        self.medecin_menzel, _ = Medecin.objects.get_or_create(
            profile=self.profile_menzel,
            defaults={'site': self.site_menzel}
        )
        # Forcer le bon site (le signal ne connaît pas le site)
        self.medecin_menzel.site = self.site_menzel
        self.medecin_menzel.save()

        # ── 3. Médecin Massadine ──────────────────────────────────────────────
        self.user_massadine = User.objects.create_user(
            username=f'mss_{uid}',
            password='pass1234'
        )

        self.profile_massadine, _ = Profile.objects.get_or_create(
            user=self.user_massadine,
            defaults={
                'role': 'medecin',
                'must_change_password': False
            }
        )
        self.profile_massadine.role = 'medecin'
        self.profile_massadine.must_change_password = False
        self.profile_massadine.save()

        self.medecin_massadine, _ = Medecin.objects.get_or_create(
            profile=self.profile_massadine,
            defaults={'site': self.site_massadine}
        )
        self.medecin_massadine.site = self.site_massadine
        self.medecin_massadine.save()

        # ── 4. Dossier médical appartenant au site Massadine ──────────────────
        self.dossier_massadine = DossierMedical.objects.create(
            site=self.site_massadine,
            nom='Test',
            prenom='Isolation'
        )

    # ─────────────────────────────────────────────────────────────────────────
    # Tests
    # ─────────────────────────────────────────────────────────────────────────

    def test_jwt_contient_bon_site(self):
        """Le token JWT du médecin Menzel contient bien le site_id de Menzel."""
        response = self.client.post('/api/account/login/', {
            'username': self.user_menzel.username,
            'password': 'pass1234'
        }, format='json')

        self.assertEqual(response.status_code, 200)
        site_id = response.data.get('site_id')
        self.assertIsNotNone(site_id, "Le token doit contenir site_id")
        self.assertEqual(
            site_id,
            self.site_menzel.id,
            "Le site_id doit être celui de Menzel"
        )

    def test_token_encode_site_menzel_pas_massadine(self):
        """Le token du médecin Menzel ne contient PAS le site_id de Massadine."""
        response = self.client.post('/api/account/login/', {
            'username': self.user_menzel.username,
            'password': 'pass1234'
        }, format='json')

        self.assertEqual(response.status_code, 200)
        site_id = response.data.get('site_id')
        self.assertIsNotNone(site_id)
        self.assertNotEqual(
            site_id,
            self.site_massadine.id,
            "Le token Menzel ne doit PAS contenir l'ID Massadine"
        )

    def test_medecin_ne_peut_pas_voir_dossier_autre_site(self):
        """Un médecin du site Menzel ne peut pas accéder au dossier du site Massadine → 404."""
        self.client.force_authenticate(user=self.user_menzel)
        response = self.client.get(
            f'/api/medical-records/dossiers/{self.dossier_massadine.id}/'
        )
        # 404 = le dossier est invisible (pas 403 qui révèle son existence)
        self.assertEqual(response.status_code, 404)