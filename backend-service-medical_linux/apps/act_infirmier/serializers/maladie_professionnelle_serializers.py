from django.utils import timezone
from rest_framework import serializers

from apps.act_infirmier.models import MaladieProfessionnelle


class MaladieProfessionnelleSerializer(serializers.ModelSerializer):
    collaborateur_nom = serializers.SerializerMethodField(read_only=True)
    collaborateur_matricule = serializers.SerializerMethodField(read_only=True)
    collaborateur_telephone = serializers.SerializerMethodField(read_only=True)
    collaborateur_date_naissance = serializers.SerializerMethodField(read_only=True)
    collaborateur_date_embauche = serializers.SerializerMethodField(read_only=True)
    collaborateur_poste = serializers.SerializerMethodField(read_only=True)
    collaborateur_department = serializers.SerializerMethodField(read_only=True)

    age = serializers.SerializerMethodField(read_only=True)
    anciennete_annees = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = MaladieProfessionnelle
        fields = [
            "id",
            "collaborateur",
            "anciennete",
            "plant_section",
            "segment",
            "infirmiere",
            "date_creation",
            "mois",
            "date_debut_maladie",
            "maladie",
            "code_tableau_cnam",
            "cause",
            "nature_travail",
            "changement_poste",
            "ancien_poste",
            "nouveau_poste",
            "decision_medecin",
            "repos_initial",
            "prolongation",
            "rechute",
            "repos_total",
            "reprise_medecin_traitant",
            "reprise_medecin_travail",
            "date_declaration_service_medical",
            "date_sortie_declaration",
            "chauffeur_sortie",
            "collaborateur_nom",
            "collaborateur_matricule",
            "collaborateur_telephone",
            "collaborateur_date_naissance",
            "collaborateur_date_embauche",
            "collaborateur_poste",
            "collaborateur_department",
            "age",
            "anciennete_annees",
        ]
        read_only_fields = [
            "infirmiere",
            "date_creation",
            "anciennete",
            "repos_total",
            "plant_section",
            "segment",
            "collaborateur_nom",
            "collaborateur_matricule",
            "collaborateur_telephone",
            "collaborateur_date_naissance",
            "collaborateur_date_embauche",
            "collaborateur_poste",
            "collaborateur_department",
            "age",
            "anciennete_annees",
        ]

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

    def get_collaborateur_telephone(self, obj):
        if not obj.collaborateur:
            return None
        try:
            return obj.collaborateur.telephone
        except Exception:
            return None

    def get_collaborateur_date_naissance(self, obj):
        return obj.collaborateur.date_naissance if obj.collaborateur else None

    def get_collaborateur_date_embauche(self, obj):
        return obj.collaborateur.date_embauche if obj.collaborateur else None

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

    def get_age(self, obj):
        if not obj.collaborateur or not obj.collaborateur.date_naissance:
            return None
        return timezone.localdate().year - obj.collaborateur.date_naissance.year

    def get_anciennete_annees(self, obj):
        if not obj.collaborateur or not obj.collaborateur.date_embauche:
            return None
        return timezone.localdate().year - obj.collaborateur.date_embauche.year

