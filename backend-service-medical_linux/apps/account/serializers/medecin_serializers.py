# account/serializers/medecin_serializers.py
from rest_framework import serializers
from apps.account.models import Medecin, Profile, MedType


class MedecinSerializer(serializers.ModelSerializer):
    """Serializer for Medecin model"""
    profile_data = serializers.SerializerMethodField()
    med_type_name = serializers.CharField(source='med_type.name', read_only=True)
    site_template_key = serializers.SerializerMethodField()

    class Meta:
        model = Medecin
        fields = (
            'id', 'profile', 'profile_data', 'med_type', 'med_type_name',
            'nom_ar', 'prenom_ar',
            'specialite', 'numero_ordre', 'lieu_exercice_medecin',
            'adresse_numero_rue', 'ville_cabinet', 'gouvernorat_cabinet',
            'grade', 'site', 'site_template_key'
        )
        read_only_fields = ('id',)

    def get_profile_data(self, obj):
        from .profile_serializers import ProfileSerializer
        return ProfileSerializer(obj.profile).data

    def get_site_template_key(self, obj):
        if not obj.site_id:
            return None
        return obj.site.template_key

    def validate_numero_ordre(self, value):
        if not value:
            raise serializers.ValidationError("Le numéro d'ordre est obligatoire.")
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)

        med_type = attrs.get('med_type', getattr(self.instance, 'med_type', None))
        site = attrs.get('site', getattr(self.instance, 'site', None))
        med_type_name = (med_type.name if med_type else '').strip().lower()

        if med_type_name == 'médecin du travail' and site is None:
            raise serializers.ValidationError({
                'site': "Le site est obligatoire pour un Médecin du Travail."
            })

        return attrs
