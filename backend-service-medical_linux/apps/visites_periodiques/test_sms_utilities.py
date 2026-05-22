"""
Tests des fonctions utilitaires SMS dans les modules VP, SS, CV, act_infirmier.
Ces fonctions pures sont testables directement sans serveur SMS.
"""
import uuid
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.contrib.auth.models import User

from apps.account.models import Infirmier, MedType, Medecin, Profile, Site
from apps.visites_periodiques.visite_periodique_sms import (
    _prenom_ou_nom as vp_prenom_ou_nom,
    _texte_rappel_veille as vp_texte_rappel,
    _lignes_file_attente as vp_lignes_file,
    notifier_veille_liste_vp_manuelle,
    envoyer_rappels_veille_j_moins_1 as vp_rappels_veille,
)
from apps.surveillance_speciale.surveillance_speciale_sms import (
    _prenom_ou_nom as ss_prenom_ou_nom,
    _texte_rappel_veille as ss_texte_rappel,
    _lignes_file_attente as ss_lignes_file,
    notifier_veille_liste_ss_manuelle,
    envoyer_rappels_veille_j_moins_1 as ss_rappels_veille,
)
from apps.control_visits.contre_visite_sms import (
    _prenom_ou_nom as cv_prenom_ou_nom,
    _lignes_file_attente as cv_lignes_file,
    envoyer_rappels_veille_j_moins_1 as cv_rappels_veille,
    notifier_veille_liste_cv_manuelle,
)

def uid(): return uuid.uuid4().hex[:6]

def creer_site():
    u = uid()
    return Site.objects.create(nom=f'Site {u}', nom_ar=f'Site {u}',
        adresse='Addr', telephone='111', code=f'S_{u}', template_key='MONASTIR')

def creer_medecin(site):
    u = uid()
    user = User.objects.create_user(username=f'med_{u}', password='pass1234')
    profile, _ = Profile.objects.get_or_create(user=user)
    profile.role = 'medecin'; profile.must_change_password = False; profile.save()
    mt, _ = MedType.objects.get_or_create(name='Médecin du Travail')
    med, _ = Medecin.objects.get_or_create(profile=profile, defaults={
        'med_type': mt, 'specialite': 'Travail', 'numero_ordre': f'O_{u}', 'site': site})
    return med


# ─── Tests _prenom_ou_nom VP ────────────────────────────────────────────────

class VPPrenomOuNomTest(TestCase):
    def test_none_retourne_collaborateur(self):
        self.assertEqual(vp_prenom_ou_nom(None), 'collaborateur')

    def test_avec_prenom(self):
        collab = MagicMock()
        collab.prenom = 'Ahmed'
        collab.nom = 'Ben Ali'
        collab.matricule = '12345'
        self.assertEqual(vp_prenom_ou_nom(collab), 'Ahmed')

    def test_sans_prenom_avec_nom(self):
        collab = MagicMock()
        collab.prenom = ''
        collab.nom = 'Ben Ali'
        collab.matricule = '12345'
        self.assertEqual(vp_prenom_ou_nom(collab), 'Ben Ali')

    def test_sans_prenom_sans_nom_avec_matricule(self):
        collab = MagicMock()
        collab.prenom = ''
        collab.nom = ''
        collab.matricule = '99999'
        result = vp_prenom_ou_nom(collab)
        self.assertIn('99999', result)

    def test_sans_rien(self):
        collab = MagicMock()
        collab.prenom = ''
        collab.nom = ''
        collab.matricule = None
        self.assertEqual(vp_prenom_ou_nom(collab), 'collaborateur')

    def test_prenom_long_tronque(self):
        collab = MagicMock()
        collab.prenom = 'A' * 100
        result = vp_prenom_ou_nom(collab)
        self.assertLessEqual(len(result), 80)


# ─── Tests _texte_rappel_veille VP ──────────────────────────────────────────

class VPTexteRappelVeilleTest(TestCase):
    def test_texte_contient_prenom(self):
        from datetime import date, timedelta
        from django.utils import timezone
        liste = MagicMock()
        liste.date_visite = timezone.localdate() + timedelta(days=1)
        texte = vp_texte_rappel(liste, 'Fatma')
        self.assertIn('Fatma', texte)
        self.assertIn('demain', texte)

    def test_texte_aujourdhui(self):
        from django.utils import timezone
        liste = MagicMock()
        liste.date_visite = timezone.localdate()
        texte = vp_texte_rappel(liste, 'Mohamed')
        self.assertIn("aujourd'hui", texte)

    def test_texte_autre_date(self):
        from datetime import date
        liste = MagicMock()
        liste.date_visite = date(2026, 12, 25)
        texte = vp_texte_rappel(liste, 'Ali')
        self.assertIn('Ali', texte)
        self.assertIn('25/12/2026', texte)

    def test_texte_sans_date(self):
        liste = MagicMock()
        liste.date_visite = None
        texte = vp_texte_rappel(liste, 'Sara')
        self.assertIn('Sara', texte)


# ─── Tests _lignes_file_attente VP ──────────────────────────────────────────

class VPLignesFileAttenteTest(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_medecin(self.site)

    def test_liste_vide(self):
        from apps.visites_periodiques.models import ListeVisitePeriodique
        from apps.account.models import Profile
        profile = self.med.profile
        liste = ListeVisitePeriodique.objects.create(
            medecin=self.med, cree_par=profile
        )
        lignes = list(vp_lignes_file(liste))
        self.assertEqual(lignes, [])


# ─── Tests rappels veille VP (mock SMS) ─────────────────────────────────────

class VPRappelsVeilleTest(TestCase):
    @patch('apps.visites_periodiques.visite_periodique_sms.send_sms')
    def test_rappels_veille_aucune_liste(self, mock_sms):
        result = vp_rappels_veille()
        self.assertIsInstance(result, int)
        mock_sms.assert_not_called()

    @patch('apps.visites_periodiques.visite_periodique_sms.send_sms')
    def test_notifier_veille_liste_vide(self, mock_sms):
        self.site = creer_site()
        self.med = creer_medecin(self.site)
        from apps.visites_periodiques.models import ListeVisitePeriodique
        liste = ListeVisitePeriodique.objects.create(
            cree_par=self.med.profile
        )
        result = notifier_veille_liste_vp_manuelle(liste)
        self.assertIsInstance(result, dict)


# ─── Tests _prenom_ou_nom SS ────────────────────────────────────────────────

class SSPrenomOuNomTest(TestCase):
    def test_none(self):
        self.assertEqual(ss_prenom_ou_nom(None), 'collaborateur')

    def test_avec_prenom(self):
        c = MagicMock()
        c.prenom = 'Nour'
        c.nom = 'Karim'
        c.matricule = '111'
        self.assertEqual(ss_prenom_ou_nom(c), 'Nour')

    def test_sans_prenom_avec_nom(self):
        c = MagicMock()
        c.prenom = ''
        c.nom = 'Karim'
        c.matricule = '111'
        self.assertEqual(ss_prenom_ou_nom(c), 'Karim')


# ─── Tests rappels veille SS (mock SMS) ─────────────────────────────────────

class SSRappelsVeilleTest(TestCase):
    @patch('apps.surveillance_speciale.surveillance_speciale_sms.send_sms')
    def test_rappels_aucune_liste(self, mock_sms):
        result = ss_rappels_veille()
        self.assertIsInstance(result, int)

    @patch('apps.surveillance_speciale.surveillance_speciale_sms.send_sms')
    def test_notifier_veille_liste_vide(self, mock_sms):
        self.site = creer_site()
        self.med = creer_medecin(self.site)
        from apps.surveillance_speciale.models import ListeSurveillanceSpeciale
        liste = ListeSurveillanceSpeciale.objects.create(
            cree_par=self.med.profile
        )
        result = notifier_veille_liste_ss_manuelle(liste)
        self.assertIsInstance(result, dict)


# ─── Tests _prenom_ou_nom CV ────────────────────────────────────────────────

class CVPrenomOuNomTest(TestCase):
    def test_none(self):
        self.assertEqual(cv_prenom_ou_nom(None), 'collaborateur')

    def test_avec_prenom(self):
        c = MagicMock()
        c.prenom = 'Hana'
        c.nom = 'Salem'
        c.matricule = '222'
        self.assertEqual(cv_prenom_ou_nom(c), 'Hana')


# ─── Tests rappels veille CV (mock SMS) ─────────────────────────────────────

class CVRappelsVeilleTest(TestCase):
    @patch('apps.control_visits.contre_visite_sms.send_sms')
    def test_rappels_aucune_liste(self, mock_sms):
        result = cv_rappels_veille()
        self.assertIsInstance(result, int)

    @patch('apps.control_visits.contre_visite_sms.send_sms')
    def test_notifier_veille_liste_vide(self, mock_sms):
        self.site = creer_site()
        self.med = creer_medecin(self.site)
        from apps.control_visits.models import ListeContreVisite
        liste = ListeContreVisite.objects.create(
            cree_par=self.med.profile
        )
        result = notifier_veille_liste_cv_manuelle(liste)
        self.assertIsInstance(result, dict)
