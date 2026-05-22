from rest_framework import serializers

from apps.consultations.models import CertificatPrenuptial


class CertificatPrenuptialSerializer(serializers.ModelSerializer):
    class Meta:
        model = CertificatPrenuptial
        fields = "__all__"
        read_only_fields = (
            "date_emission",
            "nom_prenom_medecin",
            "nom_prenom",
            "date_naissance",
            "lieu_naissance",
            "cin",
            "adresse_patient",
        )

    def validate(self, attrs):
        data = attrs.copy()
        if self.instance:
            for key in (
                "date_naissance",
                "lieu_naissance",
                "cin",
                "numero_ordre_medecin",
                "specialite_medecin",
                "lieu_exercice_medecin",
                "adresse_medecin",
                "ville_medecin",
                "gouvernorat_medecin",
            ):
                data.setdefault(key, getattr(self.instance, key, None))

        required_text_fields = (
            "numero_ordre_medecin",
            "specialite_medecin",
            "lieu_exercice_medecin",
            "adresse_medecin",
            "ville_medecin",
            "gouvernorat_medecin",
        )
        for field in required_text_fields:
            if not str(data.get(field) or "").strip():
                raise serializers.ValidationError({field: "Ce champ est obligatoire."})

        return attrs
