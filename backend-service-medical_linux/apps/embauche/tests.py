from django.contrib.auth.models import User
from django.test import TestCase
from unittest.mock import patch
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.account.models import MedType, Medecin, Profile, Site
from apps.embauche.models import CandidatEmbauche, ListeEmbauche
from apps.embauche.views.candidat_viewsets import CandidatEmbaucheViewSet
from apps.embauche.views.liste_viewsets import ListeEmbaucheViewSet


class CandidatEmbaucheSiteIsolationTests(TestCase):
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

    def test_a_examiner_filters_other_site(self):
        site_a = self._make_site('SITE_A', 'MONASTIR')
        site_b = self._make_site('SITE_B', 'SOUSSE')
        user_a, medecin_a = self._make_medecin('doc-a', site_a)
        _, medecin_b = self._make_medecin('doc-b', site_b)

        liste = ListeEmbauche.objects.create(medecin=medecin_b)
        CandidatEmbauche.objects.create(
            liste=liste,
            matricule='123',
            nom='Nom',
            prenom='Prenom',
            presence=CandidatEmbauche.PRESENCE_PRESENT,
        )

        request = self.factory.get('/api/embauche/candidats/a_examiner/')
        force_authenticate(request, user=user_a)
        response = CandidatEmbaucheViewSet.as_view({'get': 'a_examiner'})(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    def test_listes_du_jour_isolated_by_assigned_medecin_same_site(self):
        site = self._make_site('SITE_SHARED', 'MONASTIR')
        user_a, medecin_a = self._make_medecin('doc-site-a', site)
        _, medecin_b = self._make_medecin('doc-site-b', site)

        ListeEmbauche.objects.create(medecin=medecin_a)
        ListeEmbauche.objects.create(medecin=medecin_b)

        request = self.factory.get('/api/embauche/listes/')
        force_authenticate(request, user=user_a)
        response = ListeEmbaucheViewSet.as_view({'get': 'list'})(request)

        self.assertEqual(response.status_code, 200)
        rows = response.data.get('results', response.data)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['medecin'], medecin_a.id)

    @patch('apps.embauche.views.candidat_viewsets.CandidatEmbaucheViewSet._build_im_resource_map', return_value={})
    def test_candidats_list_isolated_by_assigned_medecin_same_site(self, _mock_im_map):
        site = self._make_site('SITE_SHARED_C', 'MONASTIR')
        user_a, medecin_a = self._make_medecin('doc-cand-a', site)
        _, medecin_b = self._make_medecin('doc-cand-b', site)

        liste_a = ListeEmbauche.objects.create(medecin=medecin_a)
        liste_b = ListeEmbauche.objects.create(medecin=medecin_b)
        CandidatEmbauche.objects.create(liste=liste_a, matricule='111', nom='A', prenom='A')
        CandidatEmbauche.objects.create(liste=liste_b, matricule='222', nom='B', prenom='B')

        request = self.factory.get('/api/embauche/candidats/')
        force_authenticate(request, user=user_a)
        response = CandidatEmbaucheViewSet.as_view({'get': 'list'})(request)

        self.assertEqual(response.status_code, 200)
        rows = response.data.get('results', response.data)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['matricule'], '111')
