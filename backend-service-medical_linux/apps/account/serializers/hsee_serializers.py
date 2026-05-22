# account/serializers/hsee_serializers.py
from rest_framework import serializers
from apps.account.models import HSEE


class HSEESerializer(serializers.ModelSerializer):
    """Serializer for HSEE model"""
    profile_username = serializers.CharField(source='profile.user.username', read_only=True)
    profile_email = serializers.CharField(source='profile.user.email', read_only=True)

    class Meta:
        model = HSEE
        fields = (
            'id', 'profile', 'profile_username', 'profile_email',
            'zone', 'certification', 'site'
        )
        read_only_fields = ('id',)
