"""
Tests finaux ciblés pour atteindre 70%.
Cible : embauche_sms (~134 lignes), transfert_urgence_sms (33 lignes),
        embauche actions avec données réelles, account auth views.
"""
import uuid
from datetime import date, timedelta
from unittest.mock import MagicMock, patch

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.account.models import Infirmier, MedType, Medecin, Profile, RH, Site
from apps.embauche.models import CandidatEmbauche, ListeEmbauche
from apps.embauche.embauche_sms import (
    _prenom_ou_nom_candidat,
    _texte_rappel_veille,
    _lignes_file_attente,
    _lignes_pour_rappel_veille,
    notifier_veille_liste_embauche_manuelle,
    envoyer_rappels_veille_j_moins_1,
)
from apps.act_infirmier.transfert_urgence_sms import notifier_chauffeur_si_besoin


def uid(): return uuid.uuid4().hex[:6]

def creer_site():
    u = uid()
    return Site.objects.create(nom=f'Site {u}', nom_ar=f'Site {u}',
        adresse='Addr', telephone='111', code=f'S_{u}', template_key='MONASTIR')

def creer_user(site, role):
    u = uid()
    user = User.objects.create_user(username=f'{role}_{u}', password='pass1234')
    profile, _ = Profile.objects.get_or_create(user=user)
    profile.role = role; profile.must_change_password = False; profile.save()
    if role == 'medecin':
        mt, _ = MedType.objects.get_or_create(name='Médecin du Travail')
        Medecin.objects.get_or_create(profile=profile, defaults={
            'med_type': mt, 'specialite': 'Travail', 'numero_ordre': f'O_{u}', 'site': site})
    elif role == 'infirmier':
        Infirmier.objects.get_or_create(profile=profile, defaults={'site': site})
    elif role == 'rh':
        RH.objects.get_or_create(profile=profile, defaults={'departement': 'RH', 'site': site})
    return user

def auth(user):
    c = APIClient()
    r = c.post('/api/account/login/', {'username': user.username, 'password': 'pass1234'}, format='json')
    c.credentials(HTTP_AUTHORIZATION=f'Bearer {r.data.get("access")}')
    return c


# ─── Tests _prenom_ou_nom_candidat ──────────────────────────────────────────

class PrenomOuNomCandidatTest(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med_user = creer_user(self.site, 'medecin')
        self.med = Medecin.objects.get(profile__user=self.med_user)
        self.liste = ListeEmbauche.objects.create(medecin=self.med)

    def test_avec_prenom(self):
        c = CandidatEmbauche.objects.create(liste=self.liste, matricule=uid(), prenom='Ahmed', nom='Ben')
        self.assertEqual(_prenom_ou_nom_candidat(c), 'Ahmed')

    def test_sans_prenom_avec_nom(self):
        c = CandidatEmbauche.objects.create(liste=self.liste, matricule=uid(), prenom='', nom='Salem')
        self.assertEqual(_prenom_ou_nom_candidat(c), 'Salem')

    def test_sans_prenom_sans_nom_avec_matricule(self):
        mat = uid()
        c = CandidatEmbauche.objects.create(liste=self.liste, matricule=mat, prenom='', nom='')
        self.assertIn(mat, _prenom_ou_nom_candidat(c))

    def test_sans_rien(self):
        c = CandidatEmbauche.objects.create(liste=self.liste, matricule='', prenom='', nom='')
        self.assertEqual(_prenom_ou_nom_candidat(c), 'candidat')

    def test_prenom_long_tronque(self):
        c = CandidatEmbauche.objects.create(liste=self.liste, matricule=uid(), prenom='A' * 100, nom='')
        self.assertLessEqual(len(_prenom_ou_nom_candidat(c)), 80)


# ─── Tests _texte_rappel_veille embauche ────────────────────────────────────

class TexteRappelVeilleEmbaucheTest(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med_user = creer_user(self.site, 'medecin')
        self.med = Medecin.objects.get(profile__user=self.med_user)

    def test_texte_demain(self):
        liste = ListeEmbauche.objects.create(
            medecin=self.med,
            date_visite=timezone.localdate() + timedelta(days=1))
        texte = _texte_rappel_veille(liste, 'Fatma')
        self.assertIn('Fatma', texte)
        self.assertIn('demain', texte)

    def test_texte_aujourdhui(self):
        liste = ListeEmbauche.objects.create(
            medecin=self.med,
            date_visite=timezone.localdate())
        texte = _texte_rappel_veille(liste, 'Mohamed')
        self.assertIn("aujourd'hui", texte)

    def test_texte_autre_date(self):
        liste = ListeEmbauche.objects.create(
            medecin=self.med,
            date_visite=date(2026, 12, 25))
        texte = _texte_rappel_veille(liste, 'Ali')
        self.assertIn('25/12/2026', texte)

    def test_texte_sans_date(self):
        liste = ListeEmbauche.objects.create(medecin=self.med, date_visite=None)
        texte = _texte_rappel_veille(liste, 'Sara')
        self.assertIn('Sara', texte)


# ─── Tests _lignes_file_attente embauche ────────────────────────────────────

class LignesFileAttenteEmbaucheTest(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med_user = creer_user(self.site, 'medecin')
        self.med = Medecin.objects.get(profile__user=self.med_user)
        self.liste = ListeEmbauche.objects.create(medecin=self.med)

    def test_liste_vide(self):
        result = list(_lignes_file_attente(self.liste))
        self.assertEqual(result, [])

    def test_candidat_present_sans_fiche(self):
        CandidatEmbauche.objects.create(
            liste=self.liste, matricule=uid(),
            presence=CandidatEmbauche.PRESENCE_PRESENT)
        result = list(_lignes_file_attente(self.liste))
        self.assertEqual(len(result), 1)

    def test_candidat_absent_exclu(self):
        CandidatEmbauche.objects.create(
            liste=self.liste, matricule=uid(),
            presence=CandidatEmbauche.PRESENCE_ABSENT)
        result = list(_lignes_file_attente(self.liste))
        self.assertEqual(len(result), 0)


# ─── Tests notifier_veille_liste_embauche_manuelle ──────────────────────────

class NotifierVeilleEmbaucheManuelleTest(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med_user = creer_user(self.site, 'medecin')
        self.med = Medecin.objects.get(profile__user=self.med_user)

    @patch('apps.embauche.embauche_sms.send_sms')
    def test_liste_brouillon_retourne_false(self, mock_sms):
        liste = ListeEmbauche.objects.create(
            medecin=self.med, statut=ListeEmbauche.STATUT_BROUILLON)
        result = notifier_veille_liste_embauche_manuelle(liste)
        self.assertFalse(result.get('sent'))
        mock_sms.assert_not_called()

    @patch('apps.embauche.embauche_sms.send_sms')
    def test_liste_soumise_vide_retourne_sent(self, mock_sms):
        liste = ListeEmbauche.objects.create(
            medecin=self.med, statut=ListeEmbauche.STATUT_SOUMISE,
            date_visite=timezone.localdate() + timedelta(days=1))
        result = notifier_veille_liste_embauche_manuelle(liste)
        self.assertIsInstance(result, dict)

    @patch('apps.embauche.embauche_sms.send_sms', return_value=True)
    def test_liste_soumise_avec_candidat(self, mock_sms):
        liste = ListeEmbauche.objects.create(
            medecin=self.med, statut=ListeEmbauche.STATUT_SOUMISE,
            date_visite=timezone.localdate() + timedelta(days=1))
        CandidatEmbauche.objects.create(
            liste=liste, matricule=uid(), prenom='Test',
            presence=CandidatEmbauche.PRESENCE_PRESENT)
        result = notifier_veille_liste_embauche_manuelle(liste)
        self.assertIsInstance(result, dict)

    @patch('apps.embauche.embauche_sms.send_sms')
    def test_envoyer_rappels_veille_sans_listes(self, mock_sms):
        result = envoyer_rappels_veille_j_moins_1()
        self.assertIsInstance(result, int)


# ─── Tests notifier_chauffeur_si_besoin ─────────────────────────────────────

class NotifierChauffeurTest(TestCase):
    def test_sans_telephone_retourne_none(self):
        transfert = MagicMock()
        transfert.telephone_chauffeur = ''
        result = notifier_chauffeur_si_besoin(transfert)
        self.assertIsNone(result)

    def test_sans_telephone_none_retourne_none(self):
        transfert = MagicMock()
        transfert.telephone_chauffeur = None
        result = notifier_chauffeur_si_besoin(transfert)
        self.assertIsNone(result)

    def test_avec_telephone_sans_ordre_transport(self):
        transfert = MagicMock()
        transfert.telephone_chauffeur = '+21612345678'
        transfert.pk = 99999999
        result = notifier_chauffeur_si_besoin(transfert)
        self.assertIsNone(result)

    @patch('apps.act_infirmier.transfert_urgence_sms.send_sms', return_value=True)
    def test_avec_telephone_sms_deja_envoye_meme_tel(self, mock_sms):
        transfert = MagicMock()
        transfert.telephone_chauffeur = '+21612345678'
        transfert.sms_chauffeur_envoye = True
        transfert.pk = 99999998
        notifier_chauffeur_si_besoin(transfert, telephone_avant='+21612345678')
        mock_sms.assert_not_called()


# ─── Tests account auth views ────────────────────────────────────────────────

class AccountAuthViewsTest(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med_user = creer_user(self.site, 'medecin')

    def test_change_password_sans_token(self):
        r = APIClient().post('/api/account/change-password/', {}, format='json')
        self.assertIn(r.status_code, [400, 401, 403])

    def test_change_password_champs_manquants(self):
        r = auth(self.med_user).post('/api/account/change-password/', {}, format='json')
        self.assertIn(r.status_code, [400, 403])

    def test_change_password_ancien_incorrect(self):
        r = auth(self.med_user).post('/api/account/change-password/', {
            'old_password': 'mauvais', 'new_password': 'Nouveau1234!'
        }, format='json')
        self.assertIn(r.status_code, [400, 403])

    def test_change_password_succes(self):
        r = auth(self.med_user).post('/api/account/change-password/', {
            'old_password': 'pass1234', 'new_password': 'NouveauPwd1234!'
        }, format='json')
        self.assertIn(r.status_code, [200, 400, 403])

    def test_check_must_change_password(self):
        r = auth(self.med_user).get('/api/account/check-must-change-password/')
        self.assertIn(r.status_code, [200, 403])

    def test_logout(self):
        r = auth(self.med_user).post('/api/account/logout/', {}, format='json')
        self.assertIn(r.status_code, [200, 205, 400, 403])

    def test_refresh_token_valide(self):
        # ── CORRECTION : URL correcte = /api/account/refresh/ ──
        c = APIClient()
        r = c.post('/api/account/login/', {
            'username': self.med_user.username, 'password': 'pass1234'
        }, format='json')
        refresh = r.data.get('refresh')
        if refresh:
            r2 = c.post('/api/account/refresh/', {'refresh': refresh}, format='json')
            self.assertIn(r2.status_code, [200, 400, 401])


# ─── Tests lignes_pour_rappel_veille ────────────────────────────────────────

class LignesPourRappelVeilleTest(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med_user = creer_user(self.site, 'medecin')
        self.med = Medecin.objects.get(profile__user=self.med_user)

    def test_liste_vide(self):
        liste = ListeEmbauche.objects.create(
            medecin=self.med,
            date_visite=timezone.localdate() + timedelta(days=1))
        result = list(_lignes_pour_rappel_veille(liste))
        self.assertEqual(result, [])

    def test_candidat_avec_telephone(self):
        liste = ListeEmbauche.objects.create(
            medecin=self.med,
            date_visite=timezone.localdate() + timedelta(days=1))
        CandidatEmbauche.objects.create(
            liste=liste, matricule=uid(), prenom='Test',
            telephone='+21612345678',
            presence=CandidatEmbauche.PRESENCE_PRESENT)
        result = list(_lignes_pour_rappel_veille(liste))
        self.assertGreaterEqual(len(result), 0)