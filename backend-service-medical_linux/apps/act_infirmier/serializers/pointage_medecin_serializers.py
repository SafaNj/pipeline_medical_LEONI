from rest_framework import serializers

from apps.act_infirmier.models import PointageMedecin


class PointageMedecinSerializer(serializers.ModelSerializer):
    medecin_nom = serializers.SerializerMethodField(read_only=True)
    medecin_specialite = serializers.SerializerMethodField(read_only=True)
    medecin_heures_defaut = serializers.SerializerMethodField(read_only=True)
    medecin_type = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PointageMedecin
        fields = [
            "id",
            "medecin",
            "date",
            "heures_travaillees",
            "remarque",
            "mois",
            "annee",
            "infirmiere",
            "date_creation",
            "medecin_nom",
            "medecin_specialite",
            "medecin_type",
            "medecin_heures_defaut",
        ]
        read_only_fields = ["infirmiere", "date_creation", "mois", "annee"]

    def get_medecin_nom(self, obj):
        if not obj.medecin or not obj.medecin.profile:
            return None
        u = obj.medecin.profile.user
        return f"Dr. {u.first_name} {u.last_name}".strip()

    def get_medecin_specialite(self, obj):
        return obj.medecin.specialite if obj.medecin else None

    def get_medecin_type(self, obj):
        if not obj.medecin or not obj.medecin.med_type:
            return None
        return obj.medecin.med_type.name
    
    def get_medecin_heures_defaut(self, obj):
        return obj.medecin.heures_par_defaut if obj.medecin else None