from rest_framework import serializers

from apps.control_visits.models import ContreVisite, ControleMedical


class ControleMedicalInlineSerializer(serializers.ModelSerializer):
    class Meta:
        model = ControleMedical
        fields = [
            'id', 'numero_controle', 'date_emission',
            'matricule', 'nom', 'prenom', 'repos_prescrit',
            'segment', 'avis_medecin_controleur',
        ]


class ContreVisiteSerializer(serializers.ModelSerializer):
    medecin_nom      = serializers.SerializerMethodField(read_only=True)
    site_details     = serializers.SerializerMethodField(read_only=True)
    site_id          = serializers.SerializerMethodField(read_only=True)
    site_nom         = serializers.SerializerMethodField(read_only=True)
    site_adresse     = serializers.SerializerMethodField(read_only=True)
    site_telephone   = serializers.SerializerMethodField(read_only=True)
    site_logo        = serializers.SerializerMethodField(read_only=True)
    controle_medical = ControleMedicalInlineSerializer(read_only=True)

    class Meta:
        model = ContreVisite
        fields = '__all__'
        read_only_fields = (
            'numero_ordre',
            'date_creation',
            'matricule',
            'nom_prenom',
        )
        extra_kwargs = {
            'medecin_controleur': {'required': False},
            'repos_initial':      {'required': False},
        }

    def get_medecin_nom(self, obj):
        if not obj.medecin_controleur:
            return None
        medecin = obj.medecin_controleur
        user = getattr(getattr(medecin, 'profile', None), 'user', None)
        if not user:
            return medecin.nom_ar or f'Médecin #{medecin.id}'
        full_name = (user.get_full_name() or '').strip()
        return full_name or user.username

    def get_site_nom(self, obj):
        return obj.site.nom if obj.site else None

    def get_site_id(self, obj):
        return obj.site_id

    def get_site_adresse(self, obj):
        return obj.site.adresse if obj.site else None

    def get_site_telephone(self, obj):
        return obj.site.telephone if obj.site else None

    def get_site_logo(self, obj):
        if not obj.site or not obj.site.logo:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.site.logo.url)
        return obj.site.logo.url

    def get_site_details(self, obj):
        if not obj.site:
            return None
        return {
            'id': obj.site_id,
            'nom': obj.site.nom,
            'nom_ar': obj.site.nom_ar,
            'logo_url': self.get_site_logo(obj),
            'adresse': obj.site.adresse,
            'telephone': obj.site.telephone,
            'code': obj.site.code,
        }