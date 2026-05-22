# account/serializers/profile_serializers.py
from rest_framework import serializers
from apps.account.models import Profile, MedType


class MedTypeSerializer(serializers.ModelSerializer):
    """Serializer for MedType model"""
    class Meta:
        model = MedType
        fields = ('id', 'name')
        read_only_fields = ('id',)


class ProfileSerializer(serializers.ModelSerializer):
    """Serializer for Profile model"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)
    site_template_key = serializers.SerializerMethodField()
    site_id = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = (
            'id', 'user', 'user_username', 'user_email',
            'user_first_name', 'user_last_name', 'role', 'phone', 'must_change_password',
            'site_id', 'site_template_key'
        )
        read_only_fields = ('id', 'user', 'must_change_password')

    def validate_phone(self, value):
        if value and not value.isdigit():
            raise serializers.ValidationError("Le numéro de téléphone doit contenir que des chiffres.")
        return value

    def get_site_id(self, obj):
        medecin = getattr(obj, 'medecin', None)
        return medecin.site_id if medecin else None

    def get_site_template_key(self, obj):
        medecin = getattr(obj, 'medecin', None)
        if not medecin or not medecin.site_id:
            return None
        return medecin.site.template_key
