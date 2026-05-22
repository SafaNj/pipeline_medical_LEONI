from datetime import date

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.account.models import MedType, Medecin, Profile, RH, Site
from apps.employees.models import Collaborateur
from apps.visites_periodiques.models import LigneVisitePeriodique, ListeVisitePeriodique
from apps.visites_periodiques.views.liste_vp_viewsets import ListeVisitePeriodiqueViewSet


class ListeVisitePeriodiqueIsolationTests(TestCase):
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
        return user, medecin

    def test_list_isolated_by_assigned_medecin_same_site(self):
        site = self._make_site('SITE_SHARED_VP', 'MONASTIR')
        user_a, medecin_a = self._make_medecin('vp-a', site)
        _, medecin_b = self._make_medecin('vp-b', site)
        other_site = self._make_site('SITE_OTHER_VP', 'SFAX')
        _, medecin_c = self._make_medecin('vp-c', other_site)

        ListeVisitePeriodique.objects.create(medecin=medecin_a)
        ListeVisitePeriodique.objects.create(medecin=medecin_b)
        ListeVisitePeriodique.objects.create(medecin=medecin_c)

        request = self.factory.get('/api/visites-periodiques/listes/')
        force_authenticate(request, user=user_a)
        response = ListeVisitePeriodiqueViewSet.as_view({'get': 'list'})(request)

        self.assertEqual(response.status_code, 200)
        rows = response.data.get('results', response.data)
        self.assertEqual(len(rows), 2)
        self.assertCountEqual([row['medecin'] for row in rows], [medecin_a.id, medecin_b.id])
        for row in rows:
            self.assertEqual(row.get('flux'), 'VP')
            self.assertEqual(row.get('type_liste'), 'VISITE_PERIODIQUE')

    def test_pour_medecin_true_returns_only_assigned_listes(self):
        site = self._make_site('SITE_POUR_MED', 'MONASTIR')
        user_a, medecin_a = self._make_medecin('vp-pm-a', site)
        _, medecin_b = self._make_medecin('vp-pm-b', site)

        ListeVisitePeriodique.objects.create(medecin=medecin_a)
        ListeVisitePeriodique.objects.create(medecin=medecin_b)

        request = self.factory.get(
            '/api/visites-periodiques/listes/',
            {'pour_medecin': 'true'},
        )
        force_authenticate(request, user=user_a)
        response = ListeVisitePeriodiqueViewSet.as_view({'get': 'list'})(request)

        self.assertEqual(response.status_code, 200)
        rows = response.data.get('results', response.data)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['medecin'], medecin_a.id)

    def test_pour_medecin_url_segment_returns_only_assigned_listes(self):
        site = self._make_site('SITE_POUR_MED_URL', 'MONASTIR')
        user_a, medecin_a = self._make_medecin('vp-pm-url-a', site)
        _, medecin_b = self._make_medecin('vp-pm-url-b', site)

        ListeVisitePeriodique.objects.create(medecin=medecin_a)
        ListeVisitePeriodique.objects.create(medecin=medecin_b)

        request = self.factory.get(
            '/api/medical-work/listes-visites-periodiques/pour_medecin/',
            {'site_id': str(site.id)},
        )
        force_authenticate(request, user=user_a)
        response = ListeVisitePeriodiqueViewSet.as_view({'get': 'pour_medecin'})(request)

        self.assertEqual(response.status_code, 200)
        rows = response.data.get('results', response.data)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['medecin'], medecin_a.id)
        self.assertEqual(rows[0].get('flux'), 'VP')


class ListeVisitePeriodiqueReferenceGenerationTests(TestCase):
    """Références VP-{année}-NNN : le suffixe doit suivre le max numérique, pas l’ordre lex."""

    def test_auto_reference_after_099_and_100_is_101_not_duplicate(self):
        year = 2026
        prefix = f"VP-{year}-"
        ListeVisitePeriodique.objects.create(
            reference=f"{prefix}099",
            date_visite=date(year, 1, 1),
            statut=ListeVisitePeriodique.STATUT_BROUILLON,
        )
        ListeVisitePeriodique.objects.create(
            reference=f"{prefix}100",
            date_visite=date(year, 1, 1),
            statut=ListeVisitePeriodique.STATUT_BROUILLON,
        )
        liste = ListeVisitePeriodique(
            date_visite=date(year, 6, 1),
            statut=ListeVisitePeriodique.STATUT_BROUILLON,
        )
        liste.save()
        self.assertEqual(liste.reference, f"{prefix}101")


class ListeVisitePeriodiqueCreateIdempotentTests(TestCase):
    """POST create avec une référence déjà utilisée par le brouillon du même RH."""

    def setUp(self):
        self.factory = APIRequestFactory()

    def _make_site(self, code, template_key):
        site, _ = Site.objects.get_or_create(
            code=code,
            defaults={
                "nom": code,
                "nom_ar": code,
                "adresse": "Adresse",
                "telephone": "123",
                "template_key": template_key,
            },
        )
        site.template_key = template_key
        site.save()
        return site

    def _make_rh(self, username, site):
        user = User.objects.create_user(username=username, password="pass12345")
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.role = "rh"
        profile.phone = "222"
        profile.must_change_password = False
        profile.save()
        rh = RH.objects.get(profile=profile)
        rh.departement = "RH"
        rh.site = site
        rh.save()
        return user, profile

    def _post_create(self, user, payload):
        request = self.factory.post(
            "/api/visites-periodiques/listes-visites-periodiques/",
            payload,
            format="json",
        )
        force_authenticate(request, user=user)
        return ListeVisitePeriodiqueViewSet.as_view({"post": "create"})(request)

    def test_create_same_reference_own_brouillon_updates_instead_of_400(self):
        site = self._make_site("SITE_VP_IDEM", "SOUSSE")
        rh_user, profile = self._make_rh("rh-vp-idem", site)
        c1 = Collaborateur.objects.create(matricule="VP-IDEM-1")
        c2 = Collaborateur.objects.create(matricule="VP-IDEM-2")
        d0 = date(2026, 6, 10)
        d1 = date(2026, 6, 15)

        r1 = self._post_create(
            rh_user,
            {
                "date_visite": d0.isoformat(),
                "collaborateur_ids": [c1.pk],
            },
        )
        self.assertEqual(r1.status_code, 201, r1.data)
        ref = r1.data["reference"]
        pk = r1.data["id"]

        r2 = self._post_create(
            rh_user,
            {
                "reference": ref,
                "date_visite": d1.isoformat(),
                "collaborateur_ids": [c1.pk, c2.pk],
            },
        )
        self.assertEqual(r2.status_code, 200, r2.data)
        self.assertEqual(r2.data["id"], pk)
        self.assertEqual(r2.data["reference"], ref)
        self.assertEqual(r2.data["date_visite"], d1.isoformat())
        self.assertEqual(len(r2.data["lignes"]), 2)

        liste = ListeVisitePeriodique.objects.get(pk=pk)
        self.assertEqual(liste.cree_par_id, profile.id)
        self.assertEqual(liste.statut, ListeVisitePeriodique.STATUT_BROUILLON)

    def test_create_duplicate_reference_other_rh_still_400(self):
        site = self._make_site("SITE_VP_DUP", "MONASTIR")
        rh_a, profile_a = self._make_rh("rh-vp-dup-a", site)
        rh_b, _ = self._make_rh("rh-vp-dup-b", site)
        c1 = Collaborateur.objects.create(matricule="VP-DUP-1")
        d0 = date(2026, 7, 1)

        liste = ListeVisitePeriodique(
            date_visite=d0,
            statut=ListeVisitePeriodique.STATUT_BROUILLON,
            cree_par=profile_a,
        )
        liste.reference = "VP-2026-77777"
        liste.save()
        LigneVisitePeriodique.objects.create(liste=liste, collaborateur=c1)

        r = self._post_create(
            rh_b,
            {
                "reference": "VP-2026-77777",
                "date_visite": d0.isoformat(),
                "collaborateur_ids": [c1.pk],
            },
        )
        self.assertEqual(r.status_code, 400)
        self.assertIn("référence", (r.data.get("error") or "").lower())