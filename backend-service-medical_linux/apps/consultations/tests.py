from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from datetime import datetime

from apps.account.models import Site, Medecin, Profile
from apps.account.models.profil_models import MedType
from apps.employees.models import Collaborateur
from apps.planning.models import ItemPassage, ListePassage
from apps.consultations.models import Consultation, Ordonnance, LigneOrdonnance
from apps.stock.models import Medicament, StockMedicament


class OrdonnanceCreationTest(APITestCase):

    def setUp(self):
        # Créer un site
        self.site, _ = Site.objects.get_or_create(
            code='TEST',
            defaults={'nom': 'Site Test'}
        )

        # Créer un MedType "medecin traitant"
        self.med_type, _ = MedType.objects.get_or_create(name='medecin traitant')

        # Créer un utilisateur médecin
        self.user_medecin, _ = User.objects.get_or_create(
            username='medecin_consult_test',
            defaults={'first_name': 'John', 'last_name': 'Doe'}
        )
        self.user_medecin.set_password('password123')
        self.user_medecin.save()

        # Créer le profil avec role en minuscule
        self.profile, _ = Profile.objects.get_or_create(
            user=self.user_medecin,
            defaults={'role': 'medecin', 'must_change_password': False}
        )
        self.profile.role = 'medecin'
        self.profile.must_change_password = False
        self.profile.save()

        # Créer un médecin avec site ET med_type
        self.medecin, _ = Medecin.objects.get_or_create(
            profile=self.profile,
            defaults={
                'specialite': 'Generaliste',
                'site': self.site,
                'med_type': self.med_type,
                'numero_ordre': 'TEST001'
            }
        )
        self.medecin.site = self.site
        self.medecin.med_type = self.med_type
        self.medecin.save()

        # Créer un collaborateur
        self.collaborateur, _ = Collaborateur.objects.get_or_create(
            matricule='MAT_CONSULT_001'
        )

        # Créer une liste de passage
        self.liste_passage, _ = ListePassage.objects.get_or_create(
            date=datetime.now().date(),
            session='MATIN',
            medecin=self.medecin,
            type_liste='CONSULTATION'
        )

        # Créer un item de passage
        self.item_passage, _ = ItemPassage.objects.get_or_create(
            liste=self.liste_passage,
            collaborateur=self.collaborateur,
            defaults={'statut': 'EN_ATTENTE'}
        )

        # Créer une consultation
        self.consultation, _ = Consultation.objects.get_or_create(
            item_passage=self.item_passage,
            defaults={
                'medecin': self.medecin,
                'site': self.site,
                'diagnostic': 'Test diagnostic'
            }
        )

        # Créer un médicament
        self.medicament, _ = Medicament.objects.get_or_create(
            nom='Aspirine',
            site=self.site,
            defaults={'dosage': '500mg', 'unite': 'comprimes'}
        )

        # Créer un stock pour le médicament
        self.stock, _ = StockMedicament.objects.get_or_create(
            medicament=self.medicament,
            site=self.site,
            defaults={'quantite': 100}
        )

        self.client = APIClient()

    def _get_jwt_token(self):
        response = self.client.post('/api/account/login/', {
            'username': 'medecin_consult_test',
            'password': 'password123'
        }, format='json')
        print("LOGIN STATUS:", response.status_code)
        print("LOGIN DATA:", response.data)
        return response.data.get('access')

    def test_ordonnance_creation(self):
        """Teste la création d'une ordonnance"""
        token = self._get_jwt_token()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.post('/api/consultations/ordonnances/', {
            'consultation': self.consultation.id,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_ordonnance_with_lignes(self):
        """Teste la création d'ordonnance avec lignes"""
        ordonnance, _ = Ordonnance.objects.get_or_create(
            consultation=self.consultation
        )
        LigneOrdonnance.objects.get_or_create(
            ordonnance=ordonnance,
            texte='Aspirine 500mg',
            defaults={'medicament': self.medicament}
        )
        LigneOrdonnance.objects.get_or_create(
            ordonnance=ordonnance,
            texte='Vitamine C',
        )
        token = self._get_jwt_token()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get(
            f'/api/consultations/ordonnances/{ordonnance.id}/'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)