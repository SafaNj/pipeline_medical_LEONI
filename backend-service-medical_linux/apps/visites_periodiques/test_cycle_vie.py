import uuid
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from apps.account.models import Site, Medecin, Profile
from apps.visites_periodiques.models import ListeVisitePeriodique


class CycleVieVisitePeriodiqueTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        uid = uuid.uuid4().hex[:8]

        self.site = Site.objects.create(
            nom=f'Site VP Test {uid}',
            code=f'VP_{uid}'
        )
        self.user = User.objects.create_user(
            username=f'med_vp_{uid}',
            password='pass1234'
        )
        if not Profile.objects.filter(user=self.user).exists():
            self.profile = Profile.objects.create(
                user=self.user,
                role='MEDECIN'
            )
        else:
            self.profile = Profile.objects.get(user=self.user)

        self.medecin = Medecin.objects.create(
            profile=self.profile,
            site=self.site
        )

        # Se connecter et récupérer le token
        response = self.client.post('/api/account/login/', {
            'username': self.user.username,
            'password': 'pass1234'
        }, format='json')
        token = response.data.get('access')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_liste_vp_creation_brouillon(self):
        """Une nouvelle liste VP doit être créée avec statut BROUILLON"""
        liste = ListeVisitePeriodique.objects.create(
            medecin=self.medecin,
            cree_par=self.profile
        )
        self.assertIsNotNone(liste.id)
        self.assertEqual(liste.statut, 'BROUILLON')

    def test_liste_vp_associee_au_bon_medecin(self):
        """Une liste VP doit être associée au bon médecin"""
        liste = ListeVisitePeriodique.objects.create(
            medecin=self.medecin,
            cree_par=self.profile
        )
        self.assertEqual(liste.medecin.id, self.medecin.id)
        # Le site est accessible via le médecin
        self.assertEqual(liste.medecin.site.id, self.site.id)