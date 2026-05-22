"""
Tests unitaires directs sur export_medecins_activite_service.py
Ces fonctions pures sont testables sans HTTP.
"""
import uuid
from datetime import date, timedelta
from unittest.mock import MagicMock

from django.test import TestCase
from django.contrib.auth.models import User

from apps.account.models import MedType, Medecin, Profile, Site
from apps.hsee.services.export_medecins_activite_service import (
    _medecin_nom_affiche,
    _normalise_matricule,
    _cell,
    _collab_rh_fields,
    _oui_non_predicat,
    _cle_patient,
    _parse_type_medecin_param,
    _detail_sheet_name,
    _detail_colors,
    _column_width_for_header,
    validate_export_params,
    aggregats,
    TYPE_TRAITANT,
    TYPE_TRAVAIL,
    TYPE_CONTROLEUR,
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
    profile.role = 'medecin'; profile.must_change_password = False; profile.save()
    mt, _ = MedType.objects.get_or_create(name='Médecin du Travail')
    med, _ = Medecin.objects.get_or_create(profile=profile, defaults={
        'med_type': mt, 'specialite': 'Travail', 'numero_ordre': f'O_{u}', 'site': site})
    return med


class MedecinNomAfficheTest(TestCase):
    def setUp(self):
        self.site = creer_site()
        self.med = creer_medecin(self.site)

    def test_none_retourne_tiret(self):
        self.assertEqual(_medecin_nom_affiche(None), '—')

    def test_medecin_avec_nom(self):
        result = _medecin_nom_affiche(self.med)
        self.assertIn('Trabelsi', result)

    def test_medecin_sans_nom_complet(self):
        self.med.profile.user.first_name = ''
        self.med.profile.user.last_name = ''
        self.med.profile.user.save()
        result = _medecin_nom_affiche(self.med)
        self.assertIsInstance(result, str)
        self.assertGreater(len(result), 0)

    def test_medecin_nom_commence_par_dr(self):
        self.med.profile.user.first_name = 'Dr.'
        self.med.profile.user.last_name = 'Karim'
        self.med.profile.user.save()
        result = _medecin_nom_affiche(self.med)
        self.assertIn('Dr.', result)


class NormaliseMatriculeTest(TestCase):
    def test_none(self):
        self.assertEqual(_normalise_matricule(None), '')

    def test_vide(self):
        self.assertEqual(_normalise_matricule(''), '')

    def test_minuscules_converties(self):
        self.assertEqual(_normalise_matricule('abc123'), 'ABC123')

    def test_espaces_supprimes(self):
        self.assertEqual(_normalise_matricule('  AB1  '), 'AB1')


class CellTest(TestCase):
    def test_none_retourne_vide(self):
        self.assertEqual(_cell(None), '')

    def test_nan_retourne_vide(self):
        self.assertEqual(_cell(float('nan')), '')

    def test_bool_true(self):
        self.assertEqual(_cell(True), 'oui')

    def test_bool_false(self):
        self.assertEqual(_cell(False), 'non')

    def test_int(self):
        self.assertEqual(_cell(42), 42)

    def test_string(self):
        self.assertEqual(_cell('hello'), 'hello')

    def test_zero(self):
        self.assertEqual(_cell(0), 0)


class CollabRhFieldsTest(TestCase):
    def test_none_retourne_dict_vide(self):
        result = _collab_rh_fields(None)
        self.assertIsInstance(result, dict)
        self.assertEqual(result.get('collab_poste'), '')

    def test_collab_avec_donnees(self):
        collab = MagicMock()
        collab.poste = 'Ingénieur'
        collab.departement = 'IT'
        collab.telephone = '+216123'
        collab.email = 'test@test.com'
        collab.date_naissance = date(1990, 1, 1)
        collab.sexe = 'M'
        result = _collab_rh_fields(collab)
        self.assertIsInstance(result, dict)


class OuiNonPredicatTest(TestCase):
    def test_true(self):
        self.assertEqual(_oui_non_predicat(True), 'oui')

    def test_false(self):
        self.assertEqual(_oui_non_predicat(False), 'non')


class ClePatientTest(TestCase):
    def test_avec_collab_id(self):
        result = _cle_patient(42, 'MAT001', 'FicheAptitude', 1)
        self.assertEqual(result, 'COLLAB:42')

    def test_sans_collab_avec_matricule(self):
        result = _cle_patient(None, 'MAT001', 'FicheAptitude', 1)
        self.assertIn('MAT001', result)

    def test_sans_collab_sans_matricule(self):
        result = _cle_patient(None, None, 'FicheAptitude', 99)
        self.assertIn('INCONN', result)
        self.assertIn('99', result)

    def test_matricule_normalise(self):
        result = _cle_patient(None, 'mat001', 'Test', 1)
        self.assertIn('MAT001', result)


class ParseTypeMedecinParamTest(TestCase):
    def test_none(self):
        self.assertIsNone(_parse_type_medecin_param(None))

    def test_vide(self):
        self.assertIsNone(_parse_type_medecin_param(''))

    def test_traitant(self):
        result = _parse_type_medecin_param('traitant')
        self.assertEqual(result, {TYPE_TRAITANT})

    def test_travail(self):
        result = _parse_type_medecin_param('travail')
        self.assertEqual(result, {TYPE_TRAVAIL})

    def test_controleur(self):
        result = _parse_type_medecin_param('controleur')
        self.assertEqual(result, {TYPE_CONTROLEUR})

    def test_invalide(self):
        result = _parse_type_medecin_param('inconnu')
        self.assertIsNone(result)

    def test_espaces(self):
        result = _parse_type_medecin_param('  travail  ')
        self.assertEqual(result, {TYPE_TRAVAIL})


class DetailSheetNameTest(TestCase):
    def test_traitant(self):
        self.assertIn('Traitant', _detail_sheet_name(TYPE_TRAITANT))

    def test_travail(self):
        self.assertIn('Travail', _detail_sheet_name(TYPE_TRAVAIL))

    def test_controleur(self):
        self.assertIn('Contrôleur', _detail_sheet_name(TYPE_CONTROLEUR))

    def test_inconnu(self):
        self.assertEqual(_detail_sheet_name('autre'), 'Détail')


class DetailColorsTest(TestCase):
    def test_traitant(self):
        header, zebre = _detail_colors(TYPE_TRAITANT)
        self.assertEqual(header, '2E7D32')

    def test_travail(self):
        header, zebre = _detail_colors(TYPE_TRAVAIL)
        self.assertEqual(header, '1565C0')

    def test_controleur(self):
        header, zebre = _detail_colors(TYPE_CONTROLEUR)
        self.assertEqual(header, 'E65100')

    def test_inconnu(self):
        header, zebre = _detail_colors('autre')
        self.assertEqual(header, '37474F')


class ColumnWidthForHeaderTest(TestCase):
    def test_date(self):
        self.assertEqual(_column_width_for_header('Date visite'), 22)

    def test_nom(self):
        self.assertEqual(_column_width_for_header('Nom médecin'), 28)

    def test_nb(self):
        self.assertEqual(_column_width_for_header('Nb consultations'), 14)

    def test_total(self):
        self.assertEqual(_column_width_for_header('Total'), 14)

    def test_autre(self):
        self.assertEqual(_column_width_for_header('Statut'), 18)

    def test_vide(self):
        self.assertEqual(_column_width_for_header(''), 18)

    def test_none(self):
        self.assertEqual(_column_width_for_header(None), 18)


class ValidateExportParamsTest(TestCase):
    def test_date_debut_none(self):
        result = validate_export_params(None, date.today())
        self.assertIsNotNone(result)

    def test_date_fin_none(self):
        result = validate_export_params(date.today(), None)
        self.assertIsNotNone(result)

    def test_debut_apres_fin(self):
        result = validate_export_params(date.today(), date.today() - timedelta(days=1))
        self.assertIsNotNone(result)

    def test_periode_trop_large(self):
        result = validate_export_params(date(2020, 1, 1), date(2024, 12, 31))
        self.assertIsNotNone(result)

    def test_valide(self):
        debut = date.today() - timedelta(days=30)
        fin = date.today()
        result = validate_export_params(debut, fin)
        self.assertIsNone(result)

    def test_meme_date(self):
        today = date.today()
        result = validate_export_params(today, today)
        self.assertIsNone(result)


class AggregatsTest(TestCase):
    def test_liste_vide(self):
        par_medecin, par_site = aggregats([])
        self.assertIsInstance(par_medecin, list)
        self.assertIsInstance(par_site, list)

    def test_ligne_simple(self):
        # ── CORRECTION : les clés exactes requises par aggregats() ──
        # La fonction lit: type_medecin_role, medecin_id, cle_patient,
        #                   date_jour, medecin_nom
        ligne = {
            'type_medecin_role': TYPE_TRAVAIL,   # ← clé correcte
            'medecin_id': 1,
            'medecin_nom': 'Dr Test',
            'cle_patient': 'COLLAB:1',           # ← requis
            'date_jour': date.today(),            # ← requis (objet date)
        }
        par_medecin, par_site = aggregats([ligne])
        self.assertIsInstance(par_medecin, list)
        self.assertIsInstance(par_site, list)
        self.assertEqual(len(par_medecin), 1)

    def test_deux_lignes_meme_medecin(self):
        lignes = [
            {
                'type_medecin_role': TYPE_TRAVAIL,
                'medecin_id': 1,
                'medecin_nom': 'Dr Test',
                'cle_patient': 'COLLAB:1',
                'date_jour': date.today(),
            },
            {
                'type_medecin_role': TYPE_TRAVAIL,
                'medecin_id': 1,
                'medecin_nom': 'Dr Test',
                'cle_patient': 'COLLAB:2',
                'date_jour': date.today(),
            },
        ]
        par_medecin, par_site = aggregats(lignes)
        self.assertEqual(len(par_medecin), 1)
        self.assertEqual(par_medecin[0]['nb_actes_total'], 2)

    def test_deux_medecins_differents(self):
        lignes = [
            {
                'type_medecin_role': TYPE_TRAVAIL,
                'medecin_id': 1,
                'medecin_nom': 'Dr A',
                'cle_patient': 'COLLAB:1',
                'date_jour': date.today(),
            },
            {
                'type_medecin_role': TYPE_TRAITANT,
                'medecin_id': 2,
                'medecin_nom': 'Dr B',
                'cle_patient': 'COLLAB:2',
                'date_jour': date.today(),
            },
        ]
        par_medecin, par_site = aggregats(lignes)
        self.assertEqual(len(par_medecin), 2)

    def test_medecin_id_none(self):
        ligne = {
            'type_medecin_role': TYPE_CONTROLEUR,
            'medecin_id': None,
            'medecin_nom': '',
            'cle_patient': 'INCONN:999',
            'date_jour': date(2025, 1, 15),
        }
        par_medecin, par_site = aggregats([ligne])
        self.assertIsInstance(par_medecin, list)