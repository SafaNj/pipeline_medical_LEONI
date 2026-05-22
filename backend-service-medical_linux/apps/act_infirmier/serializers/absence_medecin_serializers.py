from rest_framework import serializers

from apps.act_infirmier.models import AbsenceMedecin


class AbsenceMedecinSerializer(serializers.ModelSerializer):
    medecin_nom = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = AbsenceMedecin
        fields = [
            "id",
            "medecin",
            "date",
            "motif",
            "mois",
            "annee",
            "infirmiere",
            "date_creation",
            "medecin_nom",
        ]
        read_only_fields = ["infirmiere", "date_creation", "mois", "annee"]

    def get_medecin_nom(self, obj):
        if not obj.medecin or not obj.medecin.profile:
            return None
        u = obj.medecin.profile.user
        return f"Dr. {u.first_name} {u.last_name}".strip()
