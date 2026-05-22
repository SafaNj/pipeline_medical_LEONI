from rest_framework import serializers

from apps.consultations.models import Consultation
from apps.consultations.serializers.ordonnance_serializers import OrdonnanceSerializer
from apps.consultations.serializers.certificat_serializers import CertificatSerializer


class ConsultationSerializer(serializers.ModelSerializer):
    medecin_nom = serializers.SerializerMethodField()
    collaborateur_nom = serializers.SerializerMethodField()
    site_details = serializers.SerializerMethodField()
    site_id = serializers.SerializerMethodField()
    site_nom = serializers.SerializerMethodField()
    site_adresse = serializers.SerializerMethodField()
    site_telephone = serializers.SerializerMethodField()
    site_logo = serializers.SerializerMethodField()
    ordonnances = OrdonnanceSerializer(many=True, read_only=True)
    certificats = CertificatSerializer(many=True, read_only=True)

    class Meta:
        model = Consultation
        fields = '__all__'
        extra_kwargs = {
            'medecin': {'required': False}
        }

    def get_medecin_nom(self, obj):
        return obj.medecin.profile.user.get_full_name() \
               or obj.medecin.profile.user.username

    def get_collaborateur_nom(self, obj):
        collab = obj.item_passage.collaborateur
        if collab:
            try:
                full_name = f"{collab.nom} {collab.prenom}".strip()
                return full_name or f"Matricule {collab.matricule}"
            except Exception:
                return f"Matricule {collab.matricule}"
        return None

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