from rest_framework import serializers

from apps.act_infirmier.models import AccidentTravail


class AccidentTravailSerializer(serializers.ModelSerializer):
    collaborateur_nom = serializers.SerializerMethodField(read_only=True)
    collaborateur_matricule = serializers.SerializerMethodField(read_only=True)
    collaborateur_sexe = serializers.SerializerMethodField(read_only=True)
    collaborateur_telephone = serializers.SerializerMethodField(read_only=True)
    collaborateur_poste = serializers.SerializerMethodField(read_only=True)
    collaborateur_department = serializers.SerializerMethodField(read_only=True)
    collaborateur_date_embauche = serializers.SerializerMethodField(read_only=True)
    total_jours_perdus = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = AccidentTravail
        fields = [
            "id",
            "collaborateur",
            "num_cnam",
            "plant_section",
            "infirmiere",
            "date_creation",
            "date_accident",
            "heure_accident",
            "categorie_accident",
            "type_accident",
            "lieu_accident",
            "description",
            "siege_lesion",
            "nature_lesion",
            "cause_accident",
            "agent_materiel",
            "temoins",
            "repos_initial",
            "prolongation",
            "total_jour_perdu",
            "total_jours_perdus",
            "criticite",
            "reprise_medecin_travail",
            "date_declaration_service_medical",
            "date_sortie_declaration",
            "chauffeur_sortie",
            "reporting_interne",
            "reporting_wsd",
            "collaborateur_nom",
            "collaborateur_matricule",
            "collaborateur_sexe",
            "collaborateur_telephone",
            "collaborateur_poste",
            "collaborateur_department",
            "collaborateur_date_embauche",
        ]
        read_only_fields = ["infirmiere", "date_creation", "total_jour_perdu", "total_jours_perdus"]

    def get_collaborateur_nom(self, obj):
        if not obj.collaborateur:
            return None
        try:
            full_name = f"{obj.collaborateur.nom} {obj.collaborateur.prenom}".strip()
            return full_name or f"Matricule {obj.collaborateur.matricule}"
        except Exception:
            return f"Matricule {obj.collaborateur.matricule}"

    def get_collaborateur_matricule(self, obj):
        return obj.collaborateur.matricule if obj.collaborateur else None

    def get_collaborateur_sexe(self, obj):
        return obj.collaborateur.sexe if obj.collaborateur else None

    def get_collaborateur_telephone(self, obj):
        if not obj.collaborateur:
            return None
        try:
            return obj.collaborateur.telephone
        except Exception:
            return None

    def get_collaborateur_poste(self, obj):
        if not obj.collaborateur:
            return None
        try:
            return obj.collaborateur.poste
        except Exception:
            return None

    def get_collaborateur_department(self, obj):
        if not obj.collaborateur:
            return None
        try:
            return obj.collaborateur.department
        except Exception:
            return None

    def get_collaborateur_date_embauche(self, obj):
        return obj.collaborateur.date_embauche if obj.collaborateur else None

    def get_total_jours_perdus(self, obj):
        return obj.total_jour_perdu