from rest_framework import serializers

from apps.act_infirmier.models import DeclarationCNAM


class DeclarationCNAMSerializer(serializers.ModelSerializer):
    nom_prenom = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DeclarationCNAM
        fields = [
            "id",
            "collaborateur",
            "matricule_cnss",
            "type_accident",
            "date_accident",
            "chauffeur",
            "date_collecte_chauffeur",
            "date_cachet_cnam",
            "date_limite_declaration",
            "nb_jours_retard",
            "cause_retard",
            "commentaire",
            "actions",
            "correction",
            "infirmiere",
            "date_creation",
            "nom_prenom",
        ]
        read_only_fields = [
            "matricule_cnss",
            "nb_jours_retard",
            "infirmiere",
            "date_creation",
        ]

    def get_nom_prenom(self, obj):
        if not obj.collaborateur:
            return None
        try:
            full_name = f"{obj.collaborateur.nom} {obj.collaborateur.prenom}".strip()
            return full_name or f"Matricule {obj.collaborateur.matricule}"
        except Exception:
            return f"Matricule {obj.collaborateur.matricule}"
