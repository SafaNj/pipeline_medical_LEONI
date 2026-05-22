from rest_framework import serializers

from apps.act_infirmier.models import IncidentSansBon


class IncidentSansBonSerializer(serializers.ModelSerializer):
    nom_prenom = serializers.SerializerMethodField(read_only=True)
    poste = serializers.SerializerMethodField(read_only=True)
    telephone = serializers.SerializerMethodField(read_only=True)
    matricule = serializers.SerializerMethodField(read_only=True)
    department = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = IncidentSansBon
        fields = [
            "id",
            "collaborateur",
            "segment",
            "plant_section",
            "date_incident",
            "heure_incident",
            "mode_lesion",
            "agent_causal",
            "remarque",
            "infirmiere",
            "date_creation",
            # computed
            "nom_prenom",
            "poste",
            "telephone",
            "matricule",
            "department",
        ]
        read_only_fields = ["infirmiere", "date_creation", "segment", "plant_section"]

    def get_nom_prenom(self, obj):
        if not obj.collaborateur:
            return None
        try:
            full_name = f"{obj.collaborateur.nom} {obj.collaborateur.prenom}".strip()
            return full_name or f"Matricule {obj.collaborateur.matricule}"
        except Exception:
            return f"Matricule {obj.collaborateur.matricule}"

    def get_poste(self, obj):
        if not obj.collaborateur:
            return None
        try:
            return obj.collaborateur.poste
        except Exception:
            return None

    def get_telephone(self, obj):
        if not obj.collaborateur:
            return None
        try:
            return obj.collaborateur.telephone
        except Exception:
            return None

    def get_matricule(self, obj):
        return obj.collaborateur.matricule if obj.collaborateur else None

    def get_department(self, obj):
        if not obj.collaborateur:
            return None
        try:
            return obj.collaborateur.department
        except Exception:
            return None
