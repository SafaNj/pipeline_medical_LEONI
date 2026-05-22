from rest_framework import serializers

from apps.consultations.models import CertificatMedical


class CertificatSerializer(serializers.ModelSerializer):
    class Meta:
        model = CertificatMedical
        fields = '__all__'
        read_only_fields = (
            'date_emission',
            'nom_prenom_medecin',
            'nom_prenom_collab',
        )
