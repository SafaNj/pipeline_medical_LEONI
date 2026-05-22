from rest_framework import serializers

from apps.act_infirmier.models import RendezVousSagefemme
from apps.act_infirmier.serializers.collaborateur_fields_mixin import CollaborateurFieldsMixin


class RendezVousSagefemmeSerializer(CollaborateurFieldsMixin, serializers.ModelSerializer):
    collaborateur_nom = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = RendezVousSagefemme
        fields = [
            "id",
            "collaborateur",
            "segment",
            "secteur_collaborateur",
            "site",
            "num_tel",
            "motif_rdv",
            "date_rdv",
            "commentaire",
            "infirmiere",
            "date_creation",
            # computed
            "collaborateur_nom",
        ]
        read_only_fields = [
            "infirmiere",
            "date_creation",
            "segment",
            "secteur_collaborateur",
            "site",
            "num_tel",
        ]

    def create(self, validated_data):
        validated_data["infirmiere"] = self.context["request"].user
        return super().create(validated_data)
