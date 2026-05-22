from rest_framework import serializers

from apps.stock.models import StockMedicament


class StockMedicamentSerializer(serializers.ModelSerializer):
    medicament_nom = serializers.CharField(source='medicament.nom', read_only=True)
    medicament_unite = serializers.CharField(source='medicament.unite', read_only=True)
    medicament_unite_personnalise = serializers.CharField(
        source='medicament.unite_personnalise', read_only=True
    )
    unite_display = serializers.SerializerMethodField()
    statut = serializers.SerializerMethodField()

    class Meta:
        model = StockMedicament
        fields = '__all__'

    def get_unite_display(self, obj):
        m = obj.medicament
        if m.unite == 'autre' and (m.unite_personnalise or '').strip():
            return m.unite_personnalise.strip()
        return m.get_unite_display()

    def get_statut(self, obj):
        if obj.quantite == 0:
            return 'EPUISE'
        if obj.quantite <= obj.seuil_alerte:
            return 'FAIBLE'
        return 'OK'
