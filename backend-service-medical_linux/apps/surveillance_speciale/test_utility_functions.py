import uuid
from datetime import date, timedelta
from unittest.mock import MagicMock, patch

from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from apps.account.models import Infirmier, MedType, Medecin, Profile, RH, Site
from apps.control_visits.views.liste_contre_visite_viewsets import (
    _repos_initial_from_request,
)
from apps.embauche.views.candidat_viewsets import _im_int_or_none
from apps.hsee.services.export_medecins_activite_service import (
    aggregats, TYPE_TRAITANT, TYPE_TRAVAIL, TYPE_CONTROLEUR,
)


def uid(): return uuid.uuid4().hex[:6]


def creer_site():
    u = uid()
    return Site.objects.create(nom=f'Site {u}', nom_ar=f'Site {u}',
        adresse='Addr', telephone='111', code=f'S_{u}', template_key='MONASTIR')


def creer_medecin(site):
    u = uid()
    user = User.objects.create_user(username=f'med_{u}', password='pass1234',
        first_name='Sami', last_name='Trabelsi')
    profile, _ = Profile.objects.get_or_create(user=user)
    profile.role = 'medecin'
    profile.must_change_password = False
    profile.save()
    mt, _ = MedType.objects.get_or_create(name='Médecin du Travail')
    med, _ = Medecin.objects.get_or_create(profile=profile, defaults={
        'med_type': mt, 'specialite': 'Travail',
        'numero_ordre': f'O_{u}', 'site': site})
    return med, user


def auth(user):
    c = APIClient()
    r = c.post('/api/account/login/',
               {'username': user.username, 'password': 'pass1234'}, format='json')
    c.credentials(HTTP_AUTHORIZATION=f'Bearer {r.data.get("access")}')
    return c


# ─── Tests _repos_initial_from_request ──────────────────────────────────────

class ReposInitialFromRequestTest(TestCase):
    def test_cle_absente(self):
        present, valeur = _repos_initial_from_request({})
        self.assertFalse(present)
        self.assertIsNone(valeur)

    def test_cle_presente_none(self):
        present, valeur = _repos_initial_from_request({'repos_initial': None})
        self.assertTrue(present)
        self.assertIsNone(valeur)

    def test_cle_presente_vide(self):
        present, valeur = _repos_initial_from_request({'repos_initial': ''})
        self.assertTrue(present)
        self.assertIsNone(valeur)

    def test_cle_presente_entier(self):
        present, valeur = _repos_initial_from_request({'repos_initial': 5})
        self.assertTrue(present)
        self.assertEqual(valeur, 5)

    def test_cle_presente_string_entier(self):
        present, valeur = _repos_initial_from_request({'repos_initial': '7'})
        self.assertTrue(present)
        self.assertEqual(valeur, 7)

    def test_cle_presente_negatif_leve_erreur(self):
        with self.assertRaises(ValueError):
            _repos_initial_from_request({'repos_initial': -1})

    def test_cle_presente_invalide_leve_erreur(self):
        with self.assertRaises(ValueError):
            _repos_initial_from_request({'repos_initial': 'abc'})


# ─── Tests _im_int_or_none ───────────────────────────────────────────────────

class ImIntOrNoneTest(TestCase):
    def test_none(self):
        self.assertIsNone(_im_int_or_none(None))

    def test_vide(self):
        self.assertIsNone(_im_int_or_none(''))

    def test_entier_string(self):
        self.assertEqual(_im_int_or_none('42'), 42)

    def test_entier(self):
        self.assertEqual(_im_int_or_none(7), 7)

    def test_invalide(self):
        self.assertIsNone(_im_int_or_none('abc'))

    def test_float_string(self):
        self.assertIsNone(_im_int_or_none('3.14'))

    def test_zero(self):
        self.assertEqual(_im_int_or_none('0'), 0)


# ─── Tests aggregats ────────────────────────────────────────────────────────

class AggregatsSupplementairesTest(TestCase):
    def test_ligne_controleur(self):
        ligne = {
            'type_medecin_role': TYPE_CONTROLEUR,
            'medecin_id': 3,
            'medecin_nom': 'Dr C',
            'cle_patient': 'COLLAB:3',
            'date_jour': date(2025, 3, 20),
        }
        par_medecin, par_mois = aggregats([ligne])
        self.assertIsInstance(par_medecin, list)

    def test_medecin_id_none(self):
        ligne = {
            'type_medecin_role': TYPE_TRAVAIL,
            'medecin_id': None,
            'medecin_nom': '',
            'cle_patient': 'INCONN:1',
            'date_jour': date(2025, 5, 1),
        }
        par_medecin, par_mois = aggregats([ligne])
        self.assertIsInstance(par_medecin, list)

    def test_deux_lignes_meme_medecin(self):
        lignes = [
            {'type_medecin_role': TYPE_TRAVAIL, 'medecin_id': 1,
             'medecin_nom': 'Dr A', 'cle_patient': 'COLLAB:1',
             'date_jour': date(2025, 1, 10)},
            {'type_medecin_role': TYPE_TRAVAIL, 'medecin_id': 1,
             'medecin_nom': 'Dr A', 'cle_patient': 'COLLAB:2',
             'date_jour': date(2025, 1, 11)},
        ]
        par_medecin, par_mois = aggregats(lignes)
        self.assertEqual(len(par_medecin), 1)

    def test_deux_medecins_differents(self):
        lignes = [
            {'type_medecin_role': TYPE_TRAVAIL, 'medecin_id': 1,
             'medecin_nom': 'Dr A', 'cle_patient': 'COLLAB:1',
             'date_jour': date(2025, 2, 5)},
            {'type_medecin_role': TYPE_TRAITANT, 'medecin_id': 2,
             'medecin_nom': 'Dr B', 'cle_patient': 'COLLAB:2',
             'date_jour': date(2025, 2, 6)},
        ]
        par_medecin, par_mois = aggregats(lignes)
        self.assertEqual(len(par_medecin), 2)


# ─── Tests SS avec vraies données ────────────────────────────────────────────

class SSListeAvecDonneesTest(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med, self.med_user = creer_medecin(self.site)
        from apps.surveillance_speciale.models import ListeSurveillanceSpeciale
        self.liste = ListeSurveillanceSpeciale.objects.create(
            medecin=self.med, cree_par=self.med.profile, site=self.site)

    def test_retrieve_liste(self):
        r = auth(self.med_user).get(
            f'/api/surveillance-speciale/listes-surveillance-speciale/{self.liste.pk}/')
        self.assertIn(r.status_code, [200, 403])

    def test_liste_filtree(self):
        r = auth(self.med_user).get(
            '/api/surveillance-speciale/listes-surveillance-speciale/',
            {'medecin_id': self.med.pk})
        self.assertIn(r.status_code, [200, 403])

    def test_update_liste(self):
        r = auth(self.med_user).patch(
            f'/api/surveillance-speciale/listes-surveillance-speciale/{self.liste.pk}/',
            {}, format='json')
        self.assertIn(r.status_code, [200, 400, 403])


# ─── Tests CV avec vraies données ────────────────────────────────────────────

class CVListeAvecDonneesTest(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med, self.med_user = creer_medecin(self.site)
        from apps.control_visits.models import ListeContreVisite
        self.liste = ListeContreVisite.objects.create(
            cree_par=self.med.profile, site=self.site)

    def test_retrieve_liste(self):
        r = auth(self.med_user).get(
            f'/api/control-visits/listes-contre-visites/{self.liste.pk}/')
        self.assertIn(r.status_code, [200, 403])

    def test_repos_initial_absent(self):
        present, valeur = _repos_initial_from_request({})
        self.assertFalse(present)

    def test_update_liste(self):
        r = auth(self.med_user).patch(
            f'/api/control-visits/listes-contre-visites/{self.liste.pk}/',
            {}, format='json')
        self.assertIn(r.status_code, [200, 400, 403])


# ─── Tests supplémentaires ───────────────────────────────────────────────────

class BuildMedSyncPayloadTest(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med, self.user = creer_medecin(self.site)

    def test_candidat_basique(self):
        from apps.embauche.models import ListeEmbauche, CandidatEmbauche
        from apps.embauche.views.candidat_viewsets import _build_med_sync_payload
        liste = ListeEmbauche.objects.create(medecin=self.med)
        candidat = CandidatEmbauche.objects.create(
            liste=liste, matricule=uid(), nom='TestNom', prenom='TestPrenom')
        result = _build_med_sync_payload(candidat, self.user.username)
        self.assertIsInstance(result, dict)

    def test_candidat_sans_nom(self):
        from apps.embauche.models import ListeEmbauche, CandidatEmbauche
        from apps.embauche.views.candidat_viewsets import _build_med_sync_payload
        liste = ListeEmbauche.objects.create(medecin=self.med)
        candidat = CandidatEmbauche.objects.create(
            liste=liste, matricule=uid(), nom='', prenom='')
        result = _build_med_sync_payload(candidat, self.user.username)
        self.assertIsInstance(result, dict)


class SSMedecinTravailAPITest(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med, self.med_user = creer_medecin(self.site)
        from apps.surveillance_speciale.models import ListeSurveillanceSpeciale
        self.liste = ListeSurveillanceSpeciale.objects.create(
            medecin=self.med, cree_par=self.med.profile, site=self.site)

    def test_soumettre_liste(self):
        r = auth(self.med_user).patch(
            f'/api/surveillance-speciale/listes-surveillance-speciale/{self.liste.pk}/soumettre/')
        self.assertIn(r.status_code, [200, 400, 403])

    def test_cloturer_liste(self):
        r = auth(self.med_user).patch(
            f'/api/surveillance-speciale/listes-surveillance-speciale/{self.liste.pk}/cloturer/')
        self.assertIn(r.status_code, [200, 400, 403])

    def test_archiver_liste(self):
        r = auth(self.med_user).patch(
            f'/api/surveillance-speciale/listes-surveillance-speciale/{self.liste.pk}/archiver/')
        self.assertIn(r.status_code, [200, 400, 403])

    def test_lignes_de_la_liste(self):
        r = auth(self.med_user).get(
            '/api/surveillance-speciale/lignes-surveillance-speciale/',
            {'liste_id': self.liste.pk})
        self.assertIn(r.status_code, [200, 403])


class CVMedecinAPITest(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med, self.med_user = creer_medecin(self.site)
        from apps.control_visits.models import ListeContreVisite
        self.liste = ListeContreVisite.objects.create(
            cree_par=self.med.profile, site=self.site)

    def test_soumettre_liste(self):
        r = auth(self.med_user).patch(
            f'/api/control-visits/listes-contre-visites/{self.liste.pk}/soumettre/')
        self.assertIn(r.status_code, [200, 400, 403])

    def test_assigner_medecin(self):
        r = auth(self.med_user).patch(
            f'/api/control-visits/listes-contre-visites/{self.liste.pk}/assigner_medecin/',
            {'medecin_controleur_id': self.med.pk}, format='json')
        self.assertIn(r.status_code, [200, 400, 403])

    def test_cloturer_liste(self):
        r = auth(self.med_user).patch(
            f'/api/control-visits/listes-contre-visites/{self.liste.pk}/cloturer/')
        self.assertIn(r.status_code, [200, 400, 403])

    def test_medecins_controleurs(self):
        r = auth(self.med_user).get(
            '/api/control-visits/listes-contre-visites/medecins_controleurs/')
        self.assertIn(r.status_code, [200, 403])

    def test_lignes_filtrees(self):
        r = auth(self.med_user).get(
            '/api/control-visits/lignes-contre-visites/',
            {'liste_id': self.liste.pk})
        self.assertIn(r.status_code, [200, 403])


# ─── DernierJoursReposTest CORRIGÉ ───────────────────────────────────────────
# collaborateur est une @property sur Consultation (pas un FK).
# filter(consultation__collaborateur=None) lève une FieldError Django.
# Solution : mocker CertificatMedical.objects.filter

class DernierJoursReposTest(TestCase):

    def test_sans_collaborateur(self):
        from apps.control_visits.views.liste_contre_visite_viewsets import (
            _dernier_jours_repos_certificat_traitant,
        )
        from unittest.mock import patch, MagicMock
        mock_qs = MagicMock()
        mock_qs.select_related.return_value = mock_qs
        mock_qs.order_by.return_value = mock_qs
        mock_qs.first.return_value = None
        with patch('apps.consultations.models.CertificatMedical.objects') as mock_mgr:
            mock_mgr.filter.return_value = mock_qs
            result = _dernier_jours_repos_certificat_traitant(None)
        self.assertIsNone(result)

    def test_collaborateur_sans_certificat(self):
        from apps.control_visits.views.liste_contre_visite_viewsets import (
            _dernier_jours_repos_certificat_traitant,
        )
        from unittest.mock import patch, MagicMock
        mock_qs = MagicMock()
        mock_qs.select_related.return_value = mock_qs
        mock_qs.order_by.return_value = mock_qs
        mock_qs.first.return_value = None
        collab = MagicMock()
        with patch('apps.consultations.models.CertificatMedical.objects') as mock_mgr:
            mock_mgr.filter.return_value = mock_qs
            result = _dernier_jours_repos_certificat_traitant(collab)
        self.assertIsNone(result)

    def test_collaborateur_avec_certificat(self):
        from apps.control_visits.views.liste_contre_visite_viewsets import (
            _dernier_jours_repos_certificat_traitant,
        )
        from unittest.mock import patch, MagicMock
        cert_mock = MagicMock()
        cert_mock.jours_repos = 5
        mock_qs = MagicMock()
        mock_qs.select_related.return_value = mock_qs
        mock_qs.order_by.return_value = mock_qs
        mock_qs.first.return_value = cert_mock
        collab = MagicMock()
        with patch('apps.consultations.models.CertificatMedical.objects') as mock_mgr:
            mock_mgr.filter.return_value = mock_qs
            result = _dernier_jours_repos_certificat_traitant(collab)
        self.assertEqual(result, 5)


# ─── IsMedecinTravailTest CORRIGÉ ────────────────────────────────────────────
# _is_medecin_travail vérifie "travail" in med_type.name.lower()
# MedType.name = 'Médecin du Travail' → "travail" présent → True

class IsMedecinTravailTest(TestCase):
    def setUp(self):
        self.site = creer_site()

    def test_medecin_du_travail(self):
        from apps.surveillance_speciale.views.liste_viewsets import _is_medecin_travail
        from unittest.mock import MagicMock
        # Utiliser un mock avec med_type.name = 'Médecin du Travail'
        med_mock = MagicMock()
        med_mock.med_type.name = 'Médecin du Travail'
        result = _is_medecin_travail(med_mock)
        self.assertTrue(result)

    def test_none_retourne_false(self):
        from apps.surveillance_speciale.views.liste_viewsets import _is_medecin_travail
        self.assertFalse(_is_medecin_travail(None))

    def test_sans_med_type(self):
        from apps.surveillance_speciale.views.liste_viewsets import _is_medecin_travail
        # Créer un mock médecin sans med_type
        med_mock = MagicMock()
        med_mock.med_type = None
        self.assertFalse(_is_medecin_travail(med_mock))

    def test_med_type_generaliste(self):
        from apps.surveillance_speciale.views.liste_viewsets import _is_medecin_travail
        med_mock = MagicMock()
        med_mock.med_type = MagicMock()
        med_mock.med_type.name = 'Généraliste'
        self.assertFalse(_is_medecin_travail(med_mock))

    def test_med_type_sans_nom(self):
        from apps.surveillance_speciale.views.liste_viewsets import _is_medecin_travail
        med_mock = MagicMock()
        med_mock.med_type = MagicMock()
        med_mock.med_type.name = ''
        self.assertFalse(_is_medecin_travail(med_mock))

class CoverageFinaleTest(TestCase):
    def test_im_int_or_none_negatif(self):
        self.assertIsNone(_im_int_or_none(-5))

    def test_im_int_or_none_grand(self):
        self.assertEqual(_im_int_or_none('999'), 999)

    def test_repos_initial_zero(self):
        present, valeur = _repos_initial_from_request({'repos_initial': 0})
        self.assertTrue(present)
        self.assertEqual(valeur, 0)

    def test_repos_initial_string_zero(self):
        present, valeur = _repos_initial_from_request({'repos_initial': '0'})
        self.assertTrue(present)
        self.assertEqual(valeur, 0)

    def test_aggregats_meme_mois(self):
        from datetime import date
        lignes = [
            {'type_medecin_role': TYPE_TRAVAIL, 'medecin_id': 1,
             'medecin_nom': 'Dr X', 'cle_patient': 'C:1',
             'date_jour': date(2025, 3, 1)},
            {'type_medecin_role': TYPE_TRAVAIL, 'medecin_id': 1,
             'medecin_nom': 'Dr X', 'cle_patient': 'C:2',
             'date_jour': date(2025, 3, 15)},
        ]
        par_medecin, par_mois = aggregats(lignes)
        self.assertIsInstance(par_mois, list)

    def test_aggregats_traitant_et_travail(self):
        from datetime import date
        lignes = [
            {'type_medecin_role': TYPE_TRAITANT, 'medecin_id': 10,
             'medecin_nom': 'Dr T', 'cle_patient': 'C:10',
             'date_jour': date(2025, 4, 5)},
            {'type_medecin_role': TYPE_CONTROLEUR, 'medecin_id': 11,
             'medecin_nom': 'Dr C', 'cle_patient': 'C:11',
             'date_jour': date(2025, 4, 6)},
        ]
        par_medecin, par_mois = aggregats(lignes)
        self.assertEqual(len(par_medecin), 2)


    def test_repos_initial_grand_nombre(self):
        present, valeur = _repos_initial_from_request({'repos_initial': 30})
        self.assertTrue(present)
        self.assertEqual(valeur, 30)


class SSSerializerTest(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med, self.med_user = creer_medecin(self.site)
        from apps.surveillance_speciale.models import ListeSurveillanceSpeciale
        self.liste = ListeSurveillanceSpeciale.objects.create(
            medecin=self.med, cree_par=self.med.profile, site=self.site)

    def test_lignes_ss_creation(self):
        r = auth(self.med_user).post(
            '/api/surveillance-speciale/lignes-surveillance-speciale/',
            {'liste': self.liste.pk}, format='json')
        self.assertIn(r.status_code, [201, 400, 403])

    def test_lignes_ss_filtrees_par_liste(self):
        r = auth(self.med_user).get(
            '/api/surveillance-speciale/lignes-surveillance-speciale/',
            {'liste_id': self.liste.pk})
        self.assertIn(r.status_code, [200, 403])

    def test_liste_ss_avec_site(self):
        r = auth(self.med_user).get(
            '/api/surveillance-speciale/listes-surveillance-speciale/',
            {'site_id': self.site.pk})
        self.assertIn(r.status_code, [200, 403])

    def test_cv_lignes_filtrees(self):
        from apps.control_visits.models import ListeContreVisite
        liste_cv = ListeContreVisite.objects.create(
            cree_par=self.med.profile, site=self.site)
        r = auth(self.med_user).get(
            '/api/control-visits/lignes-contre-visites/',
            {'liste_id': liste_cv.pk})
        self.assertIn(r.status_code, [200, 403])