from rest_framework import serializers

from apps.hsee.models import ParametreHSEEMensuel


class ParametreHSEEMensuelSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParametreHSEEMensuel
        fields = ["id", "annee", "mois", "heures_travaillees", "effectif_travailleurs"]
