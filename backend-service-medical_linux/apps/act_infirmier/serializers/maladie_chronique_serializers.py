from rest_framework import serializers

from apps.act_infirmier.models import MaladieChronique
from apps.act_infirmier.serializers.collaborateur_fields_mixin import CollaborateurFieldsMixin


class MaladieChroniquSerializer(CollaborateurFieldsMixin, serializers.ModelSerializer):
    collaborateur_nom = serializers.SerializerMethodField(read_only=True)
    matricule = serializers.SerializerMethodField(read_only=True)
    infirmiere_nom = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = MaladieChronique
        fields = [
            "id",
            "collaborateur",
            "segment",
            "date_declaration",
            "type_maladie",
            "type_maladie_autre",
            "num_tel",
            "commentaire",
            "infirmiere",
            "date_creation",
            # computed
            "collaborateur_nom",
            "matricule",
            "infirmiere_nom",
        ]
        read_only_fields = ["infirmiere", "date_creation", "segment", "num_tel"]

    def validate(self, attrs):
        type_maladie = attrs.get("type_maladie")
        if type_maladie is None and self.instance is not None:
            type_maladie = self.instance.type_maladie

        type_maladie_autre = attrs.get("type_maladie_autre")
        if type_maladie_autre is None and self.instance is not None:
            type_maladie_autre = self.instance.type_maladie_autre

        type_maladie_autre = (type_maladie_autre or "").strip()

        if type_maladie == "Autre" and not type_maladie_autre:
            raise serializers.ValidationError(
                {
                    "type_maladie_autre": "Veuillez préciser la maladie si vous choisissez 'Autre'."
                }
            )

        if type_maladie != "Autre":
            attrs["type_maladie_autre"] = ""

        return attrs

    def create(self, validated_data):
        validated_data["infirmiere"] = self.context["request"].user
        return super().create(validated_data)

    def get_infirmiere_nom(self, obj):
        """
        Retourne le nom affichable de l'infirmier/infirmière qui a saisi l'enregistrement.
        Évite un 2ème appel frontend pour résoudre l'id utilisateur en nom.
        """
        user = getattr(obj, "infirmiere", None)
        if not user:
            return None
        full_name = (getattr(user, "get_full_name", lambda: "")() or "").strip()
        if full_name:
            return full_name
        username = (getattr(user, "username", "") or "").strip()
        return username or f"Infirmier #{getattr(user, 'id', '')}".strip()
