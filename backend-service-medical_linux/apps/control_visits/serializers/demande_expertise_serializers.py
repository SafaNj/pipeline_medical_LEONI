from rest_framework import serializers

from apps.control_visits.models import DemandeExpertise


class DemandeExpertiseSerializer(serializers.ModelSerializer):
    medecin_controleur_nom = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DemandeExpertise
        fields = '__all__'
        read_only_fields = (
            'medecin_controleur',
            'date_creation',
        )

    def get_medecin_controleur_nom(self, obj):
        if not obj.medecin_controleur:
            return None
        user = obj.medecin_controleur.profile.user
        full_name = user.get_full_name().strip()
        return full_name or user.username
