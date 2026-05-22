from rest_framework import serializers

from apps.visites_periodiques.models import LigneVisitePeriodique, ListeVisitePeriodique


class LigneVisitePeriodiqueSerializer(serializers.ModelSerializer):
    collaborateur_nom = serializers.SerializerMethodField(read_only=True)
    collaborateur_matricule = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = LigneVisitePeriodique
        fields = [
            "id",
            "liste",
            "collaborateur",
            "collaborateur_nom",
            "collaborateur_matricule",
            "presence",
            "fiche_aptitude",
            "sms_jour_j_envoye",
        ]
        read_only_fields = [
            "liste",
            "collaborateur",
            "collaborateur_nom",
            "collaborateur_matricule",
            "sms_jour_j_envoye",
        ]

    def get_collaborateur_nom(self, obj):
        c = obj.collaborateur
        if not c:
            return None
        try:
            full = f"{c.nom} {c.prenom}".strip()
            return full or f"Matricule {c.matricule}"
        except Exception:
            return f"Matricule {c.matricule}"

    def get_collaborateur_matricule(self, obj):
        return obj.collaborateur.matricule if obj.collaborateur_id else None


class ListeVisitePeriodiqueSerializer(serializers.ModelSerializer):
    """
    Champs ``flux`` / ``type_liste`` : toujours visite périodique (VP).
    Les listes surveillance SMS sont sur une autre API ; le front peut s’y fier sans heuristique sur la référence.
    """

    medecin_nom = serializers.SerializerMethodField(read_only=True)
    nombre_lignes = serializers.SerializerMethodField()
    nombre_presents = serializers.SerializerMethodField()
    flux = serializers.SerializerMethodField(read_only=True)
    type_liste = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ListeVisitePeriodique
        fields = [
            "id",
            "reference",
            "date_visite",
            "statut",
            "medecin",
            "medecin_nom",
            "cree_par",
            "date_creation",
            "date_modification",
            "nombre_lignes",
            "nombre_presents",
            "sms_veille_envoye",
            "flux",
            "type_liste",
        ]
        read_only_fields = [
            "reference",
            "date_creation",
            "date_modification",
            "medecin_nom",
            "sms_veille_envoye",
            "flux",
            "type_liste",
        ]

    def get_flux(self, obj):
        return "VP"

    def get_type_liste(self, obj):
        return "VISITE_PERIODIQUE"

    def get_medecin_nom(self, obj):
        if not obj.medecin_id:
            return None
        try:
            med = obj.medecin
            if not med or not med.profile_id:
                return None
            user = med.profile.user
            full_name = f"{user.first_name} {user.last_name}".strip()
            return f"Dr. {full_name}" if full_name else f"Dr. {user.username}"
        except Exception:
            return None

    def get_nombre_lignes(self, obj):
        return obj.lignes.count()

    def get_nombre_presents(self, obj):
        return obj.lignes.filter(
            presence=LigneVisitePeriodique.PRESENCE_PRESENT
        ).count()


class ListeVisitePeriodiqueDetailSerializer(ListeVisitePeriodiqueSerializer):
    lignes = LigneVisitePeriodiqueSerializer(many=True, read_only=True)

    class Meta(ListeVisitePeriodiqueSerializer.Meta):
        fields = ListeVisitePeriodiqueSerializer.Meta.fields + ["lignes"]
