from rest_framework import serializers

from apps.consultations.models import CertificatBonneSante


class CertificatBonneSanteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CertificatBonneSante
        fields = "__all__"
        read_only_fields = ("date_emission", "nom_prenom_medecin")
