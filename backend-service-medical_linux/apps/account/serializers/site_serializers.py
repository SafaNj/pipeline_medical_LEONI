from rest_framework import serializers

from apps.account.models import Site


class SiteSerializer(serializers.ModelSerializer):
    site_logo = serializers.SerializerMethodField()

    class Meta:
        model = Site
        fields = (
            'id',
            'code',
            'nom',
            'nom_ar',
            'adresse',
            'telephone',
            'template_key',
            'site_logo',
            'numero_cnss',
            'nature_activite',
            'raison_sociale',
            'numero_cnss_entreprise',
            'adresse_entreprise',
            'qualifications',
        )

    def get_site_logo(self, obj):
        if not obj.logo:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.logo.url)
        return obj.logo.url
