from rest_framework import serializers

from apps.control_visits.models import ControleMedical


class ControleMedicalSerializer(serializers.ModelSerializer):
    class Meta:
        model = ControleMedical
        fields = '__all__'
        read_only_fields = (
            'numero_controle',
            'date_creation',
            'date_modification',
            'matricule',
            'nom',
            'prenom',
            'repos_prescrit',
        )
        extra_kwargs = {
            'segment': {'required': False},
            'avis_medecin_controleur': {'required': False},
        }
