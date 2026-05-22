# planning/serializers/liste_passage_serializers.py
from rest_framework import serializers
from apps.planning.models import ListePassage
from .item_passage_serializers import ItemPassageSerializer


class ListePassageSerializer(serializers.ModelSerializer):
    items_count  = serializers.SerializerMethodField(read_only=True)
    medecin_nom  = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ListePassage
        fields = "__all__"

    def get_items_count(self, obj):
        return obj.items.count()

    def get_medecin_nom(self, obj):
        if not obj.medecin:
            return None
        u = obj.medecin.profile.user
        full = f"{u.first_name} {u.last_name}".strip()
        return f"Dr. {full}" if full else f"Dr. {u.username}"


class ListePassageDetailSerializer(serializers.ModelSerializer):
    items       = ItemPassageSerializer(many=True, read_only=True)
    medecin_nom = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ListePassage
        fields = [
            "id",
            "date",
            "session",
            "medecin",
            "medecin_nom",
            "type_liste",
            "statut",
            "created_at",
            "updated_at",
            "items",
        ]

    def get_medecin_nom(self, obj):
        if not obj.medecin:
            return None
        u = obj.medecin.profile.user
        full = f"{u.first_name} {u.last_name}".strip()
        return f"Dr. {full}" if full else f"Dr. {u.username}"