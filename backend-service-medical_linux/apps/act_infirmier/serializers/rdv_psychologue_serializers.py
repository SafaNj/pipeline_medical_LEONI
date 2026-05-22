from rest_framework import serializers
from django.utils import timezone

from apps.act_infirmier.models import RendezVousPsychologue
from apps.act_infirmier.serializers.collaborateur_fields_mixin import CollaborateurFieldsMixin


class RendezVousPsychologueSerializer(CollaborateurFieldsMixin, serializers.ModelSerializer):
    collaborateur_nom = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = RendezVousPsychologue
        fields = [
            "id",
            "collaborateur",
            "segment",
            "service",
            "position",
            "secteur_collaborateur",
            "site",
            "superieur_hierarchique",
            "num_tel",
            "date_rdv",
            "infirmiere",
            "date_creation",
            # computed
            "collaborateur_nom",
        ]
        read_only_fields = [
            "infirmiere",
            "date_creation",
            "segment",
            "service",
            "position",
            "secteur_collaborateur",
            "site",
            "superieur_hierarchique",
            "num_tel",
        ]

    def create(self, validated_data):
        validated_data["infirmiere"] = self.context["request"].user
        return super().create(validated_data)

    def validate_date_rdv(self, value):
        if value < timezone.localdate():
            raise serializers.ValidationError(
                "La date du rendez-vous psychologue ne peut pas être dans le passé."
            )
        return value
