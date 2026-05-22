from rest_framework import serializers
from apps.stock.models import ActeInfirmier


class ActeInfirmierSerializer(serializers.ModelSerializer):
    medicament_nom     = serializers.CharField(source='medicament.nom', read_only=True)
    collaborateur_nom  = serializers.SerializerMethodField()
    type_acte_display  = serializers.CharField(source='get_type_acte_display', read_only=True)
    infirmiere_nom     = serializers.SerializerMethodField()

    class Meta:
        model  = ActeInfirmier
        fields = '__all__'
        read_only_fields = ('infirmiere', 'date_acte')

    def get_collaborateur_nom(self, obj):
        if obj.collaborateur:
            try:
                full_name = f"{obj.collaborateur.nom} {obj.collaborateur.prenom}".strip()
                return full_name or f"Matricule {obj.collaborateur.matricule}"
            except Exception:
                return f"Matricule {obj.collaborateur.matricule}"
        return None

    def get_infirmiere_nom(self, obj):
        u = obj.infirmiere
        full = u.get_full_name()
        return full if full.strip() else u.username

    def validate(self, data):
        type_acte     = data.get('type_acte', ActeInfirmier.TYPE_OUVERTURE)
        collaborateur = data.get('collaborateur')

        # TYPE DON → collaborateur obligatoire
        if type_acte == ActeInfirmier.TYPE_DON and not collaborateur:
            raise serializers.ValidationError({
                'collaborateur': "Le collaborateur est obligatoire pour un don direct."
            })

        # TYPE OUVERTURE → pas de collaborateur
        if type_acte == ActeInfirmier.TYPE_OUVERTURE and collaborateur:
            raise serializers.ValidationError({
                'collaborateur': "Pas de collaborateur pour une ouverture de boîte."
            })

        return data