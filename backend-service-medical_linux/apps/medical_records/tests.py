from datetime import date
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.account.models import MedType, Medecin, Profile, Site
from apps.medical_records.models import DossierMedical
from apps.medical_records.views.dossier_viewsets import DossierMedicalViewSet


class DossierMedicalSiteIsolationTests(TestCase):

    def setUp(self):
        self.factory = APIRequestFactory()

    def _make_site(self, code, template_key):
        return Site.objects.create(
            nom=code,
            nom_ar=code,
            adresse='Adresse',
            telephone='123',
            code=code,
            template_key=template_key,
        )

    def _make_medecin(self, username, site):
        user = User.objects.create_user(username=username, password='pass12345')
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.role = 'medecin'
        profile.phone = '111'
        profile.must_change_password = False
        profile.save()
        med_type = MedType.objects.create(name='Médecin du Travail')
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
        return user, medecin

    # ── Tests existants ───────────────────────────────────────────────────────

    def test_create_forces_medecin_site(self):
        site = self._make_site('SITE_A', 'MONASTIR')
        user, _ = self._make_medecin('doc-a', site)

        request = self.factory.post(
            '/api/medical-records/dossiers/',
            {'nom': 'Nom', 'prenom': 'Prenom', 'matricule_ref': '12345'},
            format='json',
        )
        force_authenticate(request, user=user)
        response = DossierMedicalViewSet.as_view({'post': 'create'})(request)

        self.assertEqual(response.status_code, 201)
        dossier = DossierMedical.objects.get(pk=response.data['id'])
        self.assertEqual(dossier.site_id, site.id)

    def test_retrieve_other_site_is_forbidden(self):
        """
        Un médecin du site A ne peut pas accéder au dossier du site B.
        L'API retourne 404 (invisible) plutôt que 403 (plus sécurisé :
        ne révèle pas l'existence du dossier à un utilisateur non autorisé).
        """
        site_a = self._make_site('SITE_AA', 'MONASTIR')
        site_b = self._make_site('SITE_BB', 'SOUSSE')
        user_a, _ = self._make_medecin('doc-aa', site_a)
        _, medecin_b = self._make_medecin('doc-bb', site_b)

        dossier = DossierMedical.objects.create(
            site=site_b,
            nom='Nom',
            prenom='Prenom',
            date_naissance=date.today(),
        )

        request = self.factory.get(f'/api/medical-records/dossiers/{dossier.pk}/')
        force_authenticate(request, user=user_a)
        response = DossierMedicalViewSet.as_view({'get': 'retrieve'})(request, pk=dossier.pk)

        # 404 = dossier invisible pour ce site (comportement sécurisé)
        self.assertEqual(response.status_code, 404)

    # ── Tests supplémentaires pour améliorer la coverage ─────────────────────

    def test_retrieve_own_site_dossier_is_allowed(self):
        """Un médecin peut accéder aux dossiers de son propre site."""
        site = self._make_site('SITE_OWN', 'MONASTIR')
        user, medecin = self._make_medecin('doc-own', site)

        dossier = DossierMedical.objects.create(
            site=site,
            nom='Patient',
            prenom='Test',
            date_naissance=date.today(),
        )

        request = self.factory.get(f'/api/medical-records/dossiers/{dossier.pk}/')
        force_authenticate(request, user=user)
        response = DossierMedicalViewSet.as_view({'get': 'retrieve'})(request, pk=dossier.pk)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['id'], dossier.pk)

    def test_list_returns_only_own_site_dossiers(self):
        """La liste ne retourne que les dossiers du site du médecin connecté."""
        site_a = self._make_site('SITE_LST_A', 'MONASTIR')
        site_b = self._make_site('SITE_LST_B', 'SOUSSE')
        user_a, _ = self._make_medecin('doc-lst-a', site_a)
        _, medecin_b = self._make_medecin('doc-lst-b', site_b)

        dossier_a = DossierMedical.objects.create(
            site=site_a, nom='NomA', prenom='PrenomA', date_naissance=date.today()
        )
        DossierMedical.objects.create(
            site=site_b, nom='NomB', prenom='PrenomB', date_naissance=date.today()
        )

        request = self.factory.get('/api/medical-records/dossiers/')
        force_authenticate(request, user=user_a)
        response = DossierMedicalViewSet.as_view({'get': 'list'})(request)

        self.assertEqual(response.status_code, 200)
        ids = [d['id'] for d in response.data.get('results', response.data)]
        self.assertIn(dossier_a.pk, ids)
        for d_id in ids:
            self.assertNotEqual(d_id, dossier_a.pk + 1)  # dossier_b non visible

    def test_retrieve_nonexistent_dossier_returns_404(self):
        """Accès à un dossier inexistant → 404."""
        site = self._make_site('SITE_404', 'MONASTIR')
        user, _ = self._make_medecin('doc-404', site)

        request = self.factory.get('/api/medical-records/dossiers/99999/')
        force_authenticate(request, user=user)
        response = DossierMedicalViewSet.as_view({'get': 'retrieve'})(request, pk=99999)

        self.assertEqual(response.status_code, 404)

    def test_unauthenticated_access_is_rejected(self):
        """Accès sans authentification → 401 ou 403."""
        site = self._make_site('SITE_UNAUTH', 'MONASTIR')
        _, medecin = self._make_medecin('doc-unauth', site)

        dossier = DossierMedical.objects.create(
            site=site, nom='Nom', prenom='Prenom', date_naissance=date.today()
        )

        request = self.factory.get(f'/api/medical-records/dossiers/{dossier.pk}/')
        # Pas de force_authenticate → requête anonyme
        response = DossierMedicalViewSet.as_view({'get': 'retrieve'})(request, pk=dossier.pk)

        self.assertIn(response.status_code, [401, 403])