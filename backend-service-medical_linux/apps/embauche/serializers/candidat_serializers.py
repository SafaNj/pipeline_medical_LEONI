# apps/embauche/serializers/candidat_serializers.py
from rest_framework import serializers

from apps.account.utils import get_im_site_filter_from_request
from apps.embauche.models import CandidatEmbauche
from apps.employees.models import ResourceIM


class CandidatEmbaucheSerializer(serializers.ModelSerializer):
    resultat_fiche_aptitude = serializers.SerializerMethodField()
    im_data = serializers.SerializerMethodField()
    # Alias lecture seule : même valeur que numero_cnss (ne pas confondre avec ps)
    cnss = serializers.CharField(source='numero_cnss', read_only=True)

    class Meta:
        model = CandidatEmbauche
        fields = [
            'id', 'liste', 'ligne_source', 'matricule', 'nom', 'prenom',
            'cin', 'numero_cnss', 'cnss', 'date_naissance', 'genre', 'poste', 'department',
            'telephone', 'gouvernorat', 'niveau', 'num_demande', 'ps',
            'projet', 'date_recrutement', 'centre_cout', 'source_information',
            'formation', 'presence', 'fiche_aptitude', 'etat_embauche',
            'statut_integration', 'collaborateur', 'observations_medecin',
            'date_creation', 'resultat_fiche_aptitude', 'im_data', 'sms_jour_j_envoye',
        ]
        read_only_fields = [
            'liste', 'ligne_source', 'etat_embauche', 'statut_integration',
            'date_creation', 'resultat_fiche_aptitude', 'sms_jour_j_envoye',
        ]

    def get_resultat_fiche_aptitude(self, obj):
        if not obj.fiche_aptitude_id:
            return None
        return {
            'id': obj.fiche_aptitude_id,
            'aptitude': obj.fiche_aptitude.aptitude,
            'precision_aptitude': obj.fiche_aptitude.precision_aptitude,
            'date_visite': obj.fiche_aptitude.date_visite,
        }

    def get_im_data(self, obj):
        matricule = str(getattr(obj, "matricule", "") or "").strip()
        if not matricule:
            return None

        request = self.context.get("request")
        scope = get_im_site_filter_from_request(request) if request else False
        if scope is False:
            return None

        cache = self.context.get("im_resource_map") or {}
        resource = cache.get(matricule)
        if resource is None:
            try:
                qs = ResourceIM.objects.using("im_db").filter(matricule=int(matricule))
                if scope:
                    qs = qs.filter(site=scope)
                resource = qs.first()
            except (TypeError, ValueError):
                return None
            except Exception:
                return None
            if not resource:
                return None

        return {
            "lieu_naissance": resource.lieu_naissance,
            "adresse": resource.adress,
            "cin": resource.CIN,
            "cnss": resource.CNSS,
            "numero_cnss": resource.CNSS,
            "telephone": resource.telephone,
            "date_naissance": resource.date_naissance,
            "adr_ville": resource.adr_ville,
            "adr_gouv": resource.adr_gouv,
            "date_embauche": resource.date_embauche,
            "fonction": resource.fonction,
            "qualification": resource.Qualification,
        }


# Utilisé par l'Infirmier — uniquement présence/fiche/collaborateur
class CandidatUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CandidatEmbauche
        fields = ['presence', 'fiche_aptitude', 'collaborateur']


# Utilisé par la RH — modification des champs d'identité et RH
class CandidatRHUpdateSerializer(serializers.ModelSerializer):
    """Accepte aussi la clé `cnss` (alias de numero_cnss)."""

    class Meta:
        model = CandidatEmbauche
        fields = [
            'nom', 'prenom', 'matricule', 'cin', 'numero_cnss', 'date_naissance', 'genre',
            'telephone', 'gouvernorat', 'niveau', 'poste', 'department',
            'projet', 'date_recrutement', 'centre_cout', 'source_information',
            'formation', 'num_demande', 'ps',
        ]

    def to_internal_value(self, data):
        if hasattr(data, 'copy'):
            data = data.copy()
        else:
            data = dict(data)
        if hasattr(data, '_mutable') and data._mutable is False:
            data._mutable = True
        # PATCH partiel : le front envie souvent `cnss` sans `numero_cnss`
        if 'cnss' in data and 'numero_cnss' not in data:
            data['numero_cnss'] = data.get('cnss')
        if 'cnss' in data:
            data.pop('cnss', None)
        return super().to_internal_value(data)


# Utilisé par le Médecin — uniquement observations
class CandidatMedecinUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CandidatEmbauche
        fields = ['observations_medecin']