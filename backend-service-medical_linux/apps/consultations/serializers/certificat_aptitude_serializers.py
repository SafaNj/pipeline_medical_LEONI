from rest_framework import serializers

from apps.consultations.models import CertificatAptitudeGenerale


class CertificatAptitudeGeneraleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CertificatAptitudeGenerale
        fields = "__all__"
        read_only_fields = (
            "date_emission",
            "nom_prenom_medecin",
            "nom_prenom_patient",
            "date_naissance",
        )
