from rest_framework import serializers

from apps.act_infirmier.models import TransfertUrgence


class OrdreTransportInlineSerializer(serializers.Serializer):
    """Serializer léger pour imbriquer l'ordre dans le transfert."""
    id              = serializers.IntegerField(read_only=True)
    medecin         = serializers.IntegerField(source='medecin_id', allow_null=True, read_only=True)
    medecin_nom     = serializers.SerializerMethodField()
    motif           = serializers.CharField(read_only=True)
    accompagnant    = serializers.CharField(read_only=True)
    moyen_transport = serializers.CharField(read_only=True)
    infirmier_nom   = serializers.SerializerMethodField()

    def get_medecin_nom(self, obj):
        if not obj.medecin:
            return None
        try:
            u = obj.medecin.profile.user
            nom = f"{u.first_name} {u.last_name}".strip()
            return f"Dr. {nom}" if nom else f"Dr. {u.username}"
        except Exception:
            return None

    def get_infirmier_nom(self, obj):
        if not obj.infirmier:
            return None
        u = obj.infirmier
        nom = f"{u.first_name} {u.last_name}".strip()
        return nom if nom else u.username


class TransfertUrgenceSerializer(serializers.ModelSerializer):
    nom_prenom      = serializers.SerializerMethodField(read_only=True)
    matricule       = serializers.SerializerMethodField(read_only=True)
    telephone       = serializers.SerializerMethodField(read_only=True)
    ordre_transport = OrdreTransportInlineSerializer(read_only=True)

    class Meta:
        model = TransfertUrgence
        fields = [
            "id",
            "date",
            "heure",
            "chauffeur",
            "telephone_chauffeur",
            "sms_chauffeur_envoye",
            "depart",
            "destination",
            "num_ordre",
            "plant",
            "frais_deplacement",
            "cost_center",
            "collaborateur",
            "infirmiere",
            "date_creation",
            "nom_prenom",
            "matricule",
            "telephone",
           
            "ordre_transport",
        ]
        read_only_fields = ["infirmiere", "date_creation", "num_ordre", "sms_chauffeur_envoye"]

    def get_nom_prenom(self, obj):
        if not obj.collaborateur:
            return None
        try:
            full_name = f"{obj.collaborateur.nom} {obj.collaborateur.prenom}".strip()
            return full_name or f"Matricule {obj.collaborateur.matricule}"
        except Exception:
            return f"Matricule {obj.collaborateur.matricule}"

    def get_matricule(self, obj):
        return obj.collaborateur.matricule if obj.collaborateur else None

    def get_telephone(self, obj):
        if not obj.collaborateur:
            return None
        try:
            return obj.collaborateur.telephone
        except Exception:
            return None