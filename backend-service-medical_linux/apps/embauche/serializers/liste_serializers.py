from django.db.models import Q

from rest_framework import serializers

from apps.embauche.models import CandidatEmbauche, ListeEmbauche
from apps.embauche.serializers.candidat_serializers import CandidatEmbaucheSerializer


class ListeEmbaucheSerializer(serializers.ModelSerializer):
    nombre_candidats = serializers.SerializerMethodField()
    nombre_presents = serializers.SerializerMethodField()
    nombre_aptes = serializers.SerializerMethodField()
    nombre_integres = serializers.SerializerMethodField()
    nombre_reportes = serializers.SerializerMethodField()
    medecin_nom = serializers.SerializerMethodField()

    class Meta:
        model = ListeEmbauche
        fields = [
            'id',
            'reference',
            'date_visite',
            'statut',
            'medecin',
            'medecin_nom',
            'nombre_candidats',
            'nombre_presents',
            'nombre_reportes',
            'nombre_aptes',
            'nombre_integres',
            'sms_veille_envoye',
        ]

    def get_nombre_candidats(self, obj):
        return obj.candidats.count()

    def get_nombre_presents(self, obj):
        return obj.candidats.filter(presence='PRESENT').count()

    def get_nombre_reportes(self, obj):
        """
        Aligné sur la logique de cloturer : absents, ou présents sans fiche d'aptitude.
        (Pas seulement candidats - présents.)
        """
        return obj.candidats.filter(
            Q(presence=CandidatEmbauche.PRESENCE_ABSENT)
            | (
                Q(presence=CandidatEmbauche.PRESENCE_PRESENT)
                & Q(fiche_aptitude__isnull=True)
            )
        ).count()

    def get_nombre_aptes(self, obj):
        return obj.candidats.filter(etat_embauche='APTE').count()

    def get_nombre_integres(self, obj):
        """
        Nombre de candidats ayant statut_integration = INTEGRE.
        Permet au front de savoir si l'integration est complete
        (nombre_integres == nombre_aptes) pour afficher la liste en Archive.
        """
        return obj.candidats.filter(statut_integration='INTEGRE').count()

    def get_medecin_nom(self, obj):
        if not obj.medecin_id or not obj.medecin.profile_id:
            return None

        user = obj.medecin.profile.user
        full_name = f'{user.first_name} {user.last_name}'.strip()
        return f'Dr. {full_name}' if full_name else f'Dr. {user.username}'


class ListeEmbaucheDetailSerializer(ListeEmbaucheSerializer):
    """Hérite des compteurs (nombre_*) + détail des candidats."""

    candidats = CandidatEmbaucheSerializer(many=True, read_only=True)

    class Meta(ListeEmbaucheSerializer.Meta):
        fields = [
            'id',
            'reference',
            'date_visite',
            'statut',
            'medecin',
            'medecin_nom',
            'nombre_candidats',
            'nombre_presents',
            'nombre_reportes',
            'nombre_aptes',
            'nombre_integres',
            'sms_veille_envoye',
            'fichier_excel',
            'cree_par',
            'date_creation',
            'date_modification',
            'candidats',
        ]
        read_only_fields = ['reference', 'date_creation', 'date_modification']