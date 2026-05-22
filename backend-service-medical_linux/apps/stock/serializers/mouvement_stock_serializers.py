from rest_framework import serializers

from apps.stock.models import MouvementStock


class MouvementStockSerializer(serializers.ModelSerializer):
    medicament_nom      = serializers.CharField(source='stock.medicament.nom', read_only=True)
    utilisateur_nom     = serializers.SerializerMethodField()
    collaborateur_nom   = serializers.SerializerMethodField()
    collaborateur_matricule = serializers.SerializerMethodField()

    class Meta:
        model = MouvementStock
        fields = '__all__'
        read_only_fields = ('date_mouvement', 'utilisateur', 'acte')

    def get_utilisateur_nom(self, obj):
        return obj.utilisateur.get_full_name() or obj.utilisateur.username

    def get_collaborateur_nom(self, obj):
        if obj.collaborateur:
            try:
                full_name = f"{obj.collaborateur.nom} {obj.collaborateur.prenom}".strip()
                return full_name or f"Matricule {obj.collaborateur.matricule}"
            except Exception:
                return f"Matricule {obj.collaborateur.matricule}"
        return None

    def get_collaborateur_matricule(self, obj):
        return obj.collaborateur.matricule if obj.collaborateur else None