from rest_framework import serializers

from apps.consultations.models import CertificatExemption


class CertificatExemptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CertificatExemption
        fields = "__all__"
        read_only_fields = ("date_emission", "nom_prenom_medecin", "nom_patient")
