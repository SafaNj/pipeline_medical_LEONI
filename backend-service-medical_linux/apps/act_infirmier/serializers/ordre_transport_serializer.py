from rest_framework import serializers
from apps.act_infirmier.models import OrdreTransport


class OrdreTransportSerializer(serializers.ModelSerializer):

    # ── Auto depuis transfert ──────────────────────────
    num_ordre      = serializers.SerializerMethodField()
    date           = serializers.SerializerMethodField()
    heure          = serializers.SerializerMethodField()
    chauffeur      = serializers.SerializerMethodField()
    hopital        = serializers.SerializerMethodField()
    service_plant  = serializers.SerializerMethodField()

    # ── Auto depuis collaborateur ──────────────────────
    nom_malade     = serializers.SerializerMethodField()
    matricule      = serializers.SerializerMethodField()
    telephone      = serializers.SerializerMethodField()

    # ── Auto depuis medecin ────────────────────────────
    medecin_nom    = serializers.SerializerMethodField()

    # ── Auto depuis infirmier connecté ─────────────────
    infirmier_nom  = serializers.SerializerMethodField()

    class Meta:
        model  = OrdreTransport
        fields = (
            'id',
            'transfert',
            'medecin',
            # champs saisis
            'motif',
            'accompagnant',
            'moyen_transport',
            'montant_prime',
            'date_creation',
            # champs auto
            'num_ordre',
            'date',
            'heure',
            'chauffeur',
            'hopital',
            'service_plant',
            'nom_malade',
            'matricule',
            'telephone',
            'medecin_nom',
            'infirmier_nom',
        )
        read_only_fields = ('id', 'date_creation')

    # ── Méthodes auto depuis transfert ────────────────
    def get_num_ordre(self, obj):
        return obj.transfert.num_ordre

    def get_date(self, obj):
        return obj.transfert.date

    def get_heure(self, obj):
        return obj.transfert.heure

    def get_chauffeur(self, obj):
        return obj.transfert.chauffeur

    def get_hopital(self, obj):
        return obj.transfert.destination

    def get_service_plant(self, obj):
        return obj.transfert.plant

    # ── Méthodes auto depuis collaborateur ────────────
    def get_nom_malade(self, obj):
        c = obj.transfert.collaborateur
        if not c:
            return None
        try:
            return f"{c.prenom} {c.nom}".strip()
        except Exception:
            return None

    def get_matricule(self, obj):
        c = obj.transfert.collaborateur
        if not c:
            return None
        return c.matricule

    def get_telephone(self, obj):
        c = obj.transfert.collaborateur
        if not c:
            return None
        try:
            return c.telephone
        except Exception:
            return None

    # ── Méthode auto depuis medecin ───────────────────
    def get_medecin_nom(self, obj):
        if not obj.medecin:
            return None
        u = obj.medecin.profile.user
        nom = f"{u.first_name} {u.last_name}".strip()
        return f"Dr. {nom}" if nom else f"Dr. {u.username}"

    # ── Méthode auto depuis infirmier connecté ────────
    def get_infirmier_nom(self, obj):
        if not obj.infirmier:
            return None
        u = obj.infirmier
        nom = f"{u.first_name} {u.last_name}".strip()
        return nom if nom else u.username

    # ── Validation : un seul ordre par transfert ──────
    def validate_transfert(self, value):
        # En création seulement
        if self.instance is None:
            if hasattr(value, 'ordre_transport'):
                raise serializers.ValidationError(
                    "Un ordre de transport existe déjà pour ce transfert."
                )
        return value
