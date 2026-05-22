# account/serializers/infirmier_serializers.py
from rest_framework import serializers
from apps.account.models import Infirmier


class InfirmierSerializer(serializers.ModelSerializer):
    """Serializer for Infirmier model"""
    profile_username = serializers.CharField(source='profile.user.username', read_only=True)
    profile_email = serializers.CharField(source='profile.user.email', read_only=True)

    class Meta:
        model = Infirmier
        fields = (
            'id', 'profile', 'profile_username', 'profile_email',
            'service', 'shift', 'site'
        )
        read_only_fields = ('id',)

    def validate_shift(self, value):
        valid_shifts = ['morning', 'afternoon', 'night', 'day', 'soir', 'nuit']
        if value not in valid_shifts:
            raise serializers.ValidationError(
                f"Le shift doit être l'un de: {', '.join(valid_shifts)}"
            )
        return value
