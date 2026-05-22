from rest_framework import serializers

from apps.control_visits.models import LigneContreVisite, ListeContreVisite
from apps.control_visits.serializers.contre_visite_serializers import ContreVisiteSerializer


class LigneContreVisiteSerializer(serializers.ModelSerializer):
    collaborateur_nom = serializers.SerializerMethodField(read_only=True)
    collaborateur_prenom = serializers.SerializerMethodField(read_only=True)
    collaborateur_matricule = serializers.SerializerMethodField(read_only=True)
    collaborateur_departement = serializers.SerializerMethodField(read_only=True)
    contre_visite = ContreVisiteSerializer(read_only=True)

    class Meta:
        model = LigneContreVisite
        fields = '__all__'
        read_only_fields = [
            'verdict_saisi',
            'contre_visite',
            'sms_jour_j_envoye',  # renseigné côté serveur après envoi SMS
        ]
        extra_kwargs = {
            'ordre': {'required': False, 'min_value': 1},
        }

    def validate_ordre(self, value):
        if value is not None and value < 1:
            raise serializers.ValidationError('Le rang doit être >= 1.')
        return value

    def create(self, validated_data):
        liste = validated_data['liste']
        ordre = validated_data.pop('ordre', None)
        if ordre is None:
            validated_data['ordre'] = LigneContreVisite.prochain_ordre_pour_liste(liste)
        else:
            if LigneContreVisite.objects.filter(liste=liste, ordre=ordre).exists():
                raise serializers.ValidationError(
                    {'ordre': 'Ce rang est déjà utilisé dans cette liste.'}
                )
            validated_data['ordre'] = ordre
        return super().create(validated_data)

    def update(self, instance, validated_data):
        liste = validated_data.get('liste', instance.liste)
        new_ordre = validated_data.get('ordre', instance.ordre)
        if 'ordre' in validated_data or 'liste' in validated_data:
            qs = (
                LigneContreVisite.objects.filter(liste=liste, ordre=new_ordre)
                .exclude(pk=instance.pk)
            )
            if qs.exists():
                raise serializers.ValidationError(
                    {'ordre': 'Ce rang est déjà utilisé dans cette liste.'}
                )
        return super().update(instance, validated_data)

    def get_collaborateur_nom(self, obj):
        if not obj.collaborateur:
            return None
        nom = (getattr(obj.collaborateur, 'nom', '') or '').strip()
        prenom = (getattr(obj.collaborateur, 'prenom', '') or '').strip()
        full_name = f'{nom} {prenom}'.strip()
        return full_name or None

    def get_collaborateur_prenom(self, obj):
        if not obj.collaborateur:
            return None
        prenom = (getattr(obj.collaborateur, 'prenom', '') or '').strip()
        return prenom or None

    def get_collaborateur_matricule(self, obj):
        if not obj.collaborateur:
            return None
        return obj.collaborateur.matricule

    def get_collaborateur_departement(self, obj):
        if not obj.collaborateur:
            return None
        return obj.collaborateur.department


class ListeContreVisiteSerializer(serializers.ModelSerializer):
    medecin_nom = serializers.SerializerMethodField(read_only=True)
    nombre_collaborateurs = serializers.SerializerMethodField(read_only=True)
    nombre_traites = serializers.SerializerMethodField(read_only=True)
    nombre_absents = serializers.SerializerMethodField(read_only=True)
    nombre_reportes = serializers.SerializerMethodField(read_only=True)
    lignes = LigneContreVisiteSerializer(many=True, read_only=True)

    class Meta:
        model = ListeContreVisite
        fields = '__all__'
        read_only_fields = [
            'reference',
            'date_creation',
            'date_modification',
            'cree_par',
            'sms_veille_envoye',  # tâche management + logique serveur
        ]

    def get_medecin_nom(self, obj):
        if not obj.medecin_controleur:
            return None
        medecin = obj.medecin_controleur
        # Try to get name from user profile first
        user = getattr(getattr(medecin, 'profile', None), 'user', None)
        if user:
            full_name = (user.get_full_name() or '').strip()
            if full_name:
                return full_name
            if user.username:
                return user.username
        # Fallback to direct medecin attributes
        if medecin.nom_ar:
            return medecin.nom_ar
        # Last resort
        return f'Médecin #{medecin.id}'

    def get_nombre_collaborateurs(self, obj):
        return obj.lignes.count()

    def get_nombre_traites(self, obj):
        return obj.lignes.filter(verdict_saisi=True).count()

    def get_nombre_absents(self, obj):
        return obj.lignes.filter(presence='ABSENT').count()

    def get_nombre_reportes(self, obj):
        return obj.lignes.filter(presence='REPORTE').count()
