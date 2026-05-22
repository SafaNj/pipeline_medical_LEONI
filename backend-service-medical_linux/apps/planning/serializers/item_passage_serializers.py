# planning/serializers/item_passage_serializers.py
from rest_framework import serializers
from apps.planning.models import ItemPassage
from apps.consultations.serializers.consultation_serializers import ConsultationSerializer


class ItemPassageSerializer(serializers.ModelSerializer):
    collaborateur_nom        = serializers.SerializerMethodField(read_only=True)
    collaborateur_matricule  = serializers.SerializerMethodField(read_only=True)
    collaborateur_departement = serializers.SerializerMethodField(read_only=True)
    collaborateur_poste      = serializers.SerializerMethodField(read_only=True)
    consultation             = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ItemPassage
        fields = "__all__"

    def get_consultation(self, obj):
        """Retourne la consultation liée à cet item (avec ordonnances et certificats)."""
        try:
            c = obj.consultation  # OneToOne reverse relation
            return ConsultationSerializer(c, context=self.context).data
        except Exception:
            return None

    def get_collaborateur_nom(self, obj):
        if obj.collaborateur_id:
            try:
                full_name = f"{obj.collaborateur.nom} {obj.collaborateur.prenom}".strip()
                return full_name or f"Matricule {obj.collaborateur.matricule}"
            except Exception:
                return f"Matricule {obj.collaborateur.matricule}"
        return None

    def get_collaborateur_matricule(self, obj):
        if obj.collaborateur_id:
            return obj.collaborateur.matricule
        return None

    def get_collaborateur_departement(self, obj):
        if obj.collaborateur_id:
            try:
                return obj.collaborateur.department
            except Exception:
                return None
        return None

    def get_collaborateur_poste(self, obj):
        if obj.collaborateur_id:
            try:
                return obj.collaborateur.poste
            except Exception:
                return None
        return None