from rest_framework import serializers

from apps.act_infirmier.models import EnqueteAccident


class EnqueteAccidentSerializer(serializers.ModelSerializer):
    """Enquête : champs propres + champs dérivés de l'accident parent (lecture seule)."""

    collaborateur_nom = serializers.SerializerMethodField(read_only=True)
    collaborateur_matricule = serializers.SerializerMethodField(read_only=True)
    date_accident = serializers.SerializerMethodField(read_only=True)
    heure_accident = serializers.SerializerMethodField(read_only=True)
    lieu_accident = serializers.SerializerMethodField(read_only=True)
    siege_lesion = serializers.SerializerMethodField(read_only=True)
    nature_lesion = serializers.SerializerMethodField(read_only=True)
    redige_par_nom = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = EnqueteAccident
        fields = [
            "id",
            "accident",
            "telephone_victime",
            "appartenance",
            "horaire_travail",
            "circonstances",
            "lieu_transport",
            "temoins",
            "redige_par",
            "redige_par_nom",
            "date_redaction",
            "date_modification",
            "collaborateur_nom",
            "collaborateur_matricule",
            "date_accident",
            "heure_accident",
            "lieu_accident",
            "siege_lesion",
            "nature_lesion",
        ]
        read_only_fields = [
            "id",
            "accident",
            "redige_par",
            "date_redaction",
            "date_modification",
            "collaborateur_nom",
            "collaborateur_matricule",
            "date_accident",
            "heure_accident",
            "lieu_accident",
            "siege_lesion",
            "nature_lesion",
            "redige_par_nom",
        ]

    def get_collaborateur_nom(self, obj):
        collab = obj.accident.collaborateur if obj.accident_id else None
        if not collab:
            return None
        try:
            full_name = f"{collab.nom} {collab.prenom}".strip()
            return full_name or f"Matricule {collab.matricule}"
        except Exception:
            return f"Matricule {collab.matricule}"

    def get_collaborateur_matricule(self, obj):
        if not obj.accident_id or not obj.accident.collaborateur_id:
            return None
        return obj.accident.collaborateur.matricule

    def get_date_accident(self, obj):
        return obj.accident.date_accident if obj.accident_id else None

    def get_heure_accident(self, obj):
        return obj.accident.heure_accident if obj.accident_id else None

    def get_lieu_accident(self, obj):
        return obj.accident.lieu_accident if obj.accident_id else None

    def get_siege_lesion(self, obj):
        return obj.accident.siege_lesion if obj.accident_id else None

    def get_nature_lesion(self, obj):
        return obj.accident.nature_lesion if obj.accident_id else None

    def get_redige_par_nom(self, obj):
        user = obj.redige_par
        if not user:
            return None
        full = user.get_full_name()
        if full and full.strip():
            return full.strip()
        return user.username or None

    def validate_temoins(self, value):
        if value in (None, ""):
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError("Le champ temoins doit être une liste.")

        normalized = []
        for index, temoin in enumerate(value, start=1):
            if not isinstance(temoin, dict):
                raise serializers.ValidationError(
                    f"Le témoin #{index} doit être un objet JSON avec au moins 'nom'."
                )
            nom = str(temoin.get("nom") or "").strip()
            prenom = str(temoin.get("prenom") or "").strip()
            matricule = str(temoin.get("matricule") or "").strip()
            cin = str(temoin.get("cin") or "").strip()
            telephone = str(temoin.get("telephone") or "").strip()
            if not nom:
                raise serializers.ValidationError(
                    f"Le témoin #{index} doit contenir un 'nom' non vide."
                )
            normalized.append(
                {
                    "nom": nom,
                    "prenom": prenom,
                    "matricule": matricule,
                    "cin": cin,
                    "telephone": telephone,
                }
            )
        return normalized
