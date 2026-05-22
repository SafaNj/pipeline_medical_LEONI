from rest_framework import serializers

from apps.consultations.models import Ordonnance
from apps.consultations.serializers.ligne_ordonnance_serializers import (
    LigneOrdonnanceSerializer,
)


class OrdonnanceSerializer(serializers.ModelSerializer):
    lignes = LigneOrdonnanceSerializer(
        many=True,
        read_only=True,
        source='lignes_ordonnance',
    )
    lignes_count = serializers.SerializerMethodField()

    class Meta:
        model = Ordonnance
        fields = (
            'id',
            'consultation',
            'date_emission',
            'lignes',
            'lignes_count',
        )
        extra_kwargs = {
            'consultation': {'required': False, 'allow_null': True},
        }
        read_only_fields = ('date_emission', 'lignes', 'lignes_count')

    def get_lignes_count(self, obj):
        return obj.lignes_ordonnance.count()
