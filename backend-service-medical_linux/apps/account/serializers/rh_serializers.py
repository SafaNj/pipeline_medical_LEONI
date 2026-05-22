# account/serializers/rh_serializers.py
from rest_framework import serializers
from apps.account.models import RH


class RHSerializer(serializers.ModelSerializer):
    """Serializer for RH model"""
    profile_username = serializers.CharField(source='profile.user.username', read_only=True)
    profile_email = serializers.CharField(source='profile.user.email', read_only=True)

    class Meta:
        model = RH
        fields = (
            'id', 'profile', 'profile_username', 'profile_email',
            'departement', 'site'
        )
        read_only_fields = ('id',)
