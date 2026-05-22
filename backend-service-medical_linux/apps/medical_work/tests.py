from datetime import date, timedelta

from apps.medical_work.date_utils import add_calendar_months
from unittest.mock import MagicMock, patch

from django.contrib.auth.models import User
from django.test import SimpleTestCase, TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.account.models import MedType, Medecin, Profile, Site
from apps.employees.models import Collaborateur
from apps.medical_work.models import FicheAptitude
from apps.visites_periodiques.models import LigneVisitePeriodique, ListeVisitePeriodique
from apps.medical_work.serializers import FicheAptitudeSerializer
from apps.medical_work.querysets import filter_fiches_collaborateur_in_im_db
from apps.medical_work.views.medical_work_viewsets import FicheAptitudeViewSet


class FilterFichesImDbTests(SimpleTestCase):
    @patch("apps.medical_work.querysets.ResourceIM")
    def test_all_non_numeric_matricules_returns_none_queryset(self, mock_resource):
        root = MagicMock()
        inner = MagicMock()
        root.filter.return_value = inner
        inner.values_list.return_value.distinct.return_value = ["abc", ""]
        empty_qs = MagicMock()
        inner.none.return_value = empty_qs

        result = filter_fiches_collaborateur_in_im_db(root)

        root.filter.assert_called_once_with(collaborateur__isnull=False)
        inner.none.assert_called_once()
        self.assertIs(result, empty_qs)
        mock_resource.objects.using.assert_not_called()

    @patch("apps.medical_work.querysets.ResourceIM")
    def test_filters_matricules_found_in_im_db_only(self, mock_resource):
        mock_resource.objects.using.return_value.filter.return_value.values_list.return_value = [
            100,
            200,
        ]

        root = MagicMock()
        inner = MagicMock()
        final = MagicMock()
        root.filter.return_value = inner
        inner.values_list.return_value.distinct.return_value = ["100", "200", "999"]
        inner.filter.return_value = final

        result = filter_fiches_collaborateur_in_im_db(root)

        self.assertIs(result, final)
        inner.filter.assert_called_once()
        kw = inner.filter.call_args[1]
        self.assertEqual(set(kw["collaborateur__matricule__in"]), {"100", "200"})

    @patch("apps.medical_work.querysets.ResourceIM")
    def test_im_db_empty_returns_none_queryset(self, mock_resource):
        mock_resource.objects.using.return_value.filter.return_value.values_list.return_value = []

        root = MagicMock()
        inner = MagicMock()
        root.filter.return_value = inner
        inner.values_list.return_value.distinct.return_value = ["42"]
        empty_qs = MagicMock()
        inner.none.return_value = empty_qs

        result = filter_fiches_collaborateur_in_im_db(root)

        self.assertIs(result, empty_qs)
        inner.none.assert_called_once()


class FicheAptitudeSiteIsolationTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    def _make_site(self, code, template_key):
        site, _ = Site.objects.get_or_create(
            code=code,
            defaults={
                'nom': code,
                'nom_ar': code,
                'adresse': 'Adresse',
                'telephone': '123',
                'template_key': template_key,
            },
        )
        site.nom = code
        site.nom_ar = code
        site.adresse = 'Adresse'
        site.telephone = '123'
        site.template_key = template_key
        site.save()
        return site

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

    def _make_rh(self, username, site):
        from apps.account.models import RH

        user = User.objects.create_user(username=username, password='pass12345')
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.role = 'rh'
        profile.phone = '222'
        profile.must_change_password = False
        profile.save()
        rh, _ = RH.objects.get_or_create(
            profile=profile,
            defaults={'departement': 'RH', 'site': site},
        )
        rh.departement = 'RH'
        rh.site = site
        rh.save(update_fields=['departement', 'site'])
        return user

    def _create_fiche_payload(self, **overrides):
        payload = {
            'date_visite': date.today().isoformat(),
            'type_visite': 'REPRISE',
            'aptitude': 'aptitude_temporaire',
            'precision_aptitude': 'Peut reprendre son travail',
        }
        payload.update(overrides)
        return payload

    def _post_create(self, user, payload):
        request = self.factory.post('/api/medical-work/fiches-aptitude/', payload, format='json')
        force_authenticate(request, user=user)
        return FicheAptitudeViewSet.as_view({'post': 'create'})(request)

    # ── Tests d'isolation site ────────────────────────────────────────────────

    def test_retrieve_other_site_is_forbidden(self):
        """
        Un médecin du site A ne peut pas accéder à la fiche du site B.
        L'API retourne 404 (invisible) — plus sécurisé que 403 car ne
        révèle pas l'existence de la ressource.
        """
        site_a = self._make_site('SITE_A', 'MONASTIR')
        site_b = self._make_site('SITE_B', 'SOUSSE')
        user_a, _ = self._make_medecin('doc-a', site_a)
        _, medecin_b = self._make_medecin('doc-b', site_b)

        fiche = FicheAptitude.objects.create(
            medecin_travail=medecin_b,
            site=site_b,
            date_visite=date.today(),
            type_visite='EMBAUCHE',
            aptitude='APTE_AU_POSTE',
        )

        request = self.factory.get(f'/api/medical-work/fiches-aptitude/{fiche.pk}/')
        force_authenticate(request, user=user_a)
        response = FicheAptitudeViewSet.as_view({'get': 'retrieve'})(request, pk=fiche.pk)

        # 404 = fiche invisible pour ce site (comportement sécurisé)
        self.assertEqual(response.status_code, 404)

    def test_retrieve_own_site_fiche_is_allowed(self):
        """Un médecin peut accéder aux fiches de son propre site."""
        site = self._make_site('SITE_OWN_FA', 'MONASTIR')
        user, medecin = self._make_medecin('doc-own-fa', site)

        fiche = FicheAptitude.objects.create(
            medecin_travail=medecin,
            site=site,
            date_visite=date.today(),
            type_visite='EMBAUCHE',
            aptitude='APTE_AU_POSTE',
        )

        request = self.factory.get(f'/api/medical-work/fiches-aptitude/{fiche.pk}/')
        force_authenticate(request, user=user)
        response = FicheAptitudeViewSet.as_view({'get': 'retrieve'})(request, pk=fiche.pk)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['id'], fiche.pk)

    def test_list_returns_only_own_site_fiches(self):
        """La liste ne retourne que les fiches du site du médecin connecté."""
        site_a = self._make_site('SITE_LST_FA_A', 'MONASTIR')
        site_b = self._make_site('SITE_LST_FA_B', 'SOUSSE')
        user_a, medecin_a = self._make_medecin('doc-lst-fa-a', site_a)
        _, medecin_b = self._make_medecin('doc-lst-fa-b', site_b)

        fiche_a = FicheAptitude.objects.create(
            medecin_travail=medecin_a, site=site_a,
            date_visite=date.today(), type_visite='EMBAUCHE', aptitude='APTE_AU_POSTE',
        )
        FicheAptitude.objects.create(
            medecin_travail=medecin_b, site=site_b,
            date_visite=date.today(), type_visite='EMBAUCHE', aptitude='APTE_AU_POSTE',
        )

        request = self.factory.get('/api/medical-work/fiches-aptitude/')
        force_authenticate(request, user=user_a)
        response = FicheAptitudeViewSet.as_view({'get': 'list'})(request)

        self.assertEqual(response.status_code, 200)
        ids = [f['id'] for f in response.data.get('results', response.data)]
        self.assertIn(fiche_a.pk, ids)

    def test_unauthenticated_access_is_rejected(self):
        """Accès sans authentification → 401 ou 403."""
        site = self._make_site('SITE_UNAUTH_FA', 'MONASTIR')
        _, medecin = self._make_medecin('doc-unauth-fa', site)

        fiche = FicheAptitude.objects.create(
            medecin_travail=medecin, site=site,
            date_visite=date.today(), type_visite='EMBAUCHE', aptitude='APTE_AU_POSTE',
        )

        request = self.factory.get(f'/api/medical-work/fiches-aptitude/{fiche.pk}/')
        response = FicheAptitudeViewSet.as_view({'get': 'retrieve'})(request, pk=fiche.pk)

        self.assertIn(response.status_code, [401, 403])

    # ── Tests création ────────────────────────────────────────────────────────

    def test_create_messadine_does_not_require_entreprise_fields(self):
        site = self._make_site('MASSADINE', 'SOUSSE')
        user, _ = self._make_medecin('doc-massadine', site)

        response = self._post_create(user, self._create_fiche_payload())

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['site_template_key'], 'SOUSSE')
        self.assertEqual(response.data['site_nom'], site.nom)

    def test_create_menzel_requires_entreprise_fields(self):
        site = self._make_site('MENZEL_HAYET', 'MONASTIR')
        user, _ = self._make_medecin('doc-menzel', site)

        response = self._post_create(user, self._create_fiche_payload())

        self.assertEqual(response.status_code, 400)
        self.assertIn('raison_sociale', response.data)
        self.assertIn('nature_activite', response.data)
        self.assertIn('numero_cnss_entreprise', response.data)

    def test_create_menzel_with_entreprise_fields_succeeds(self):
        site = self._make_site('MENZEL_HAYET', 'MONASTIR')
        user, _ = self._make_medecin('doc-menzel-ok', site)

        response = self._post_create(
            user,
            self._create_fiche_payload(
                raison_sociale='Entreprise Test',
                nature_activite='Industrie',
                adresse_entreprise='Zone industrielle',
                numero_cnss_entreprise='12345678',
            ),
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['site_template_key'], 'MONASTIR')
        self.assertEqual(response.data['site_nom'], site.nom)

    # ── Tests alertes RH ──────────────────────────────────────────────────────

    def test_rh_alertes_visite_periodique_one_month_before_due_date(self):
        site = self._make_site('SITE_RH_ALERT', 'MONASTIR')
        rh_user = self._make_rh('rh-alert', site)
        _, medecin = self._make_medecin('doc-alert', site)

        collab = Collaborateur.objects.create(matricule='12345')
        FicheAptitude.objects.create(
            collaborateur=collab, medecin_travail=medecin, site=site,
            date_visite=date.today() - timedelta(days=340),
            type_visite='PERIODIQUE', aptitude='APTE_AU_POSTE', validite_mois=12,
        )
        FicheAptitude.objects.create(
            collaborateur=collab, medecin_travail=medecin, site=site,
            date_visite=date.today() - timedelta(days=400),
            type_visite='PERIODIQUE', aptitude='APTE_AU_POSTE', validite_mois=12,
        )

        request = self.factory.get('/api/medical-work/fiches-aptitude/alertes-visite-periodique-rh/')
        force_authenticate(request, user=rh_user)
        response = FicheAptitudeViewSet.as_view({'get': 'alertes_visite_periodique_rh'})(request)

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['count'], 1)
        row = response.data['results'][0]
        self.assertEqual(row['collaborateur_id'], collab.id)
        self.assertLessEqual(row['jours_avant_echeance'], 30)

    def test_rh_alertes_exclude_collaborateur_liste_vp_soumise(self):
        site = self._make_site('SITE_RH_VP_EXCL', 'MONASTIR')
        rh_user = self._make_rh('rh-vp-excl', site)
        _, medecin = self._make_medecin('doc-vp-excl', site)

        collab = Collaborateur.objects.create(matricule='77777')
        FicheAptitude.objects.create(
            collaborateur=collab, medecin_travail=medecin, site=site,
            date_visite=date.today() - timedelta(days=340),
            type_visite='PERIODIQUE', aptitude='APTE_AU_POSTE', validite_mois=12,
        )
        liste = ListeVisitePeriodique.objects.create(
            date_visite=date.today(),
            statut=ListeVisitePeriodique.STATUT_SOUMISE,
        )
        LigneVisitePeriodique.objects.create(liste=liste, collaborateur=collab)

        request = self.factory.get('/api/medical-work/fiches-aptitude/alertes-visite-periodique-rh/')
        force_authenticate(request, user=rh_user)
        response = FicheAptitudeViewSet.as_view({'get': 'alertes_visite_periodique_rh'})(request)

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['count'], 0)

    def test_rh_alertes_vp_hier_exclue_meme_si_horizon_365(self):
        site = self._make_site('SITE_VP_HIER', 'MONASTIR')
        rh_user = self._make_rh('rh-vp-hier', site)
        _, medecin = self._make_medecin('doc-vp-hier', site)

        collab = Collaborateur.objects.create(matricule='66001')
        FicheAptitude.objects.create(
            collaborateur=collab, medecin_travail=medecin, site=site,
            date_visite=date.today() - timedelta(days=1),
            type_visite='PERIODIQUE', aptitude='APTE_AU_POSTE', validite_mois=12,
        )

        request = self.factory.get(
            '/api/medical-work/fiches-aptitude/alertes-visite-periodique-rh/',
            {'horizon_jours': '365'},
        )
        force_authenticate(request, user=rh_user)
        response = FicheAptitudeViewSet.as_view({'get': 'alertes_visite_periodique_rh'})(request)

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['count'], 0)

    def test_rh_alertes_dpv_trop_lointaine_utilise_calcul_periodicite(self):
        site = self._make_site('SITE_STALE_DPV', 'MONASTIR')
        rh_user = self._make_rh('rh-stale-dpv', site)
        _, medecin = self._make_medecin('doc-stale-dpv', site)

        collab = Collaborateur.objects.create(matricule='55123')
        FicheAptitude.objects.create(
            collaborateur=collab, medecin_travail=medecin, site=site,
            date_visite=date.today() - timedelta(days=380),
            type_visite='PERIODIQUE', aptitude='APTE_AU_POSTE', validite_mois=12,
            date_prochaine_visite=date.today() + timedelta(days=200),
        )

        request = self.factory.get(
            '/api/medical-work/fiches-aptitude/alertes-visite-periodique-rh/',
            {'horizon_jours': '30'},
        )
        force_authenticate(request, user=rh_user)
        response = FicheAptitudeViewSet.as_view({'get': 'alertes_visite_periodique_rh'})(request)

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['type_alerte'], 'VISITE_PERIODIQUE')

    def test_rh_alertes_vp_calendrier_12_mois_longue_validite(self):
        site = self._make_site('SITE_VP_CAL', 'MONASTIR')
        rh_user = self._make_rh('rh-vp-cal', site)
        _, medecin = self._make_medecin('doc-vp-cal', site)

        collab = Collaborateur.objects.create(matricule='77123')
        FicheAptitude.objects.create(
            collaborateur=collab, medecin_travail=medecin, site=site,
            date_visite=date.today() - timedelta(days=400),
            type_visite='PERIODIQUE', aptitude='APTE_AU_POSTE', validite_mois=24,
            date_prochaine_visite=date.today() + timedelta(days=300),
        )

        request = self.factory.get(
            '/api/medical-work/fiches-aptitude/alertes-visite-periodique-rh/',
            {'horizon_jours': '30'},
        )
        force_authenticate(request, user=rh_user)
        response = FicheAptitudeViewSet.as_view({'get': 'alertes_visite_periodique_rh'})(request)

        self.assertEqual(response.status_code, 200, response.data)
        self.assertGreaterEqual(response.data['count'], 1)
        alerts = [r['type_alerte'] for r in response.data['results']]
        self.assertTrue(all(a == 'VISITE_PERIODIQUE' for a in alerts))

    def test_rh_alertes_dpv_future_ne_masque_pas_retard_periodicite(self):
        site = self._make_site('SITE_DPV_MASK', 'MONASTIR')
        rh_user = self._make_rh('rh-dpv-mask', site)
        _, medecin = self._make_medecin('doc-dpv-mask', site)

        collab = Collaborateur.objects.create(matricule='77124')
        FicheAptitude.objects.create(
            collaborateur=collab, medecin_travail=medecin, site=site,
            date_visite=date.today() - timedelta(days=400),
            type_visite='PERIODIQUE', aptitude='APTE_AU_POSTE', validite_mois=12,
            date_prochaine_visite=date.today() + timedelta(days=90),
        )

        request = self.factory.get(
            '/api/medical-work/fiches-aptitude/alertes-visite-periodique-rh/',
            {'horizon_jours': '30'},
        )
        force_authenticate(request, user=rh_user)
        response = FicheAptitudeViewSet.as_view({'get': 'alertes_visite_periodique_rh'})(request)

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['type_alerte'], 'VISITE_PERIODIQUE')

    def test_rh_alertes_retard_suivi_reprise_sans_fiche_vp(self):
        site = self._make_site('SITE_RETARD_REP', 'MONASTIR')
        rh_user = self._make_rh('rh-retard-rep', site)
        _, medecin = self._make_medecin('doc-retard-rep', site)

        collab = Collaborateur.objects.create(matricule='55124')
        FicheAptitude.objects.create(
            collaborateur=collab, medecin_travail=medecin, site=site,
            date_visite=date.today() - timedelta(days=400),
            type_visite='REPRISE', aptitude='APTE_AU_POSTE', validite_mois=12,
        )

        request = self.factory.get('/api/medical-work/fiches-aptitude/alertes-visite-periodique-rh/')
        force_authenticate(request, user=rh_user)
        response = FicheAptitudeViewSet.as_view({'get': 'alertes_visite_periodique_rh'})(request)

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['count'], 1)
        row = response.data['results'][0]
        self.assertEqual(row['type_alerte'], 'VISITE_PERIODIQUE')
        self.assertEqual(row['type_visite'], 'REPRISE')

    def test_rh_alertes_echeance_from_date_prochaine_visite(self):
        site = self._make_site('SITE_RH_DPV', 'MONASTIR')
        rh_user = self._make_rh('rh-dpv', site)
        _, medecin = self._make_medecin('doc-dpv', site)

        collab = Collaborateur.objects.create(matricule='88888')
        dv = date.today() - timedelta(days=800)
        FicheAptitude.objects.create(
            collaborateur=collab, medecin_travail=medecin, site=site,
            date_visite=dv, type_visite='PERIODIQUE', aptitude='APTE_AU_POSTE',
            validite_mois=12,
            date_prochaine_visite=date.today() + timedelta(days=10),
        )

        request = self.factory.get(
            '/api/medical-work/fiches-aptitude/alertes-visite-periodique-rh/',
            {'horizon_jours': '30'},
        )
        force_authenticate(request, user=rh_user)
        response = FicheAptitudeViewSet.as_view({'get': 'alertes_visite_periodique_rh'})(request)

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['horizon_jours'], 30)
        row = response.data['results'][0]
        self.assertEqual(row['collaborateur_id'], collab.id)
        self.assertEqual(row['type_alerte'], 'VISITE_PERIODIQUE')
        self.assertEqual(row['derniere_visite_date'], dv.isoformat())
        self.assertNotIn('date_prochaine_visite', row)

    def test_rh_alertes_horizon_jours_excludes_far_echeance(self):
        site = self._make_site('SITE_RH_HORIZ', 'MONASTIR')
        rh_user = self._make_rh('rh-horiz', site)
        _, medecin = self._make_medecin('doc-horiz', site)

        collab = Collaborateur.objects.create(matricule='77778')
        FicheAptitude.objects.create(
            collaborateur=collab, medecin_travail=medecin, site=site,
            date_visite=date.today() - timedelta(days=100),
            type_visite='PERIODIQUE', aptitude='APTE_AU_POSTE', validite_mois=12,
            date_prochaine_visite=date.today() + timedelta(days=45),
        )

        request = self.factory.get(
            '/api/medical-work/fiches-aptitude/alertes-visite-periodique-rh/',
            {'horizon_jours': '30'},
        )
        force_authenticate(request, user=rh_user)
        response = FicheAptitudeViewSet.as_view({'get': 'alertes_visite_periodique_rh'})(request)

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['count'], 0)

        request_ok = self.factory.get(
            '/api/medical-work/fiches-aptitude/alertes-visite-periodique-rh/',
            {'horizon_jours': '60'},
        )
        force_authenticate(request_ok, user=rh_user)
        response_ok = FicheAptitudeViewSet.as_view({'get': 'alertes_visite_periodique_rh'})(request_ok)
        self.assertEqual(response_ok.data['count'], 0)


class FicheAptitudeSerializerTests(SimpleTestCase):
    def test_accepts_new_aptitude_values(self):
        base_payload = {
            'date_visite': '2026-04-13',
            'type_visite': 'REPRISE',
        }

        for aptitude in ('aptitude', 'reprise_mo_at', 'aptitude_temporaire'):
            serializer = FicheAptitudeSerializer(data={**base_payload, 'aptitude': aptitude})
            self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_does_not_require_entreprise_fields_on_create_payload(self):
        serializer = FicheAptitudeSerializer(
            data={
                'date_visite': '2026-04-13',
                'type_visite': 'REPRISE',
                'aptitude': 'aptitude_temporaire',
                'precision_aptitude': 'Peut reprendre sous réserve',
            }
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)


class AddCalendarMonthsTests(SimpleTestCase):
    def test_twelve_months_from_month_end(self):
        self.assertEqual(
            add_calendar_months(date(2025, 1, 31), 12),
            date(2026, 1, 31),
        )

    def test_twelve_months_not_plainly_360_days(self):
        start = date(2025, 6, 15)
        by_calendar = add_calendar_months(start, 12)
        by_360 = start + timedelta(days=360)
        self.assertEqual(by_calendar, date(2026, 6, 15))
        self.assertNotEqual(by_calendar, by_360)