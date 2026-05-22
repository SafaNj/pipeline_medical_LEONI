from rest_framework import serializers

from apps.act_infirmier.models import DocumentMedicalScanne

MAX_FICHIER_OCTETS = 10 * 1024 * 1024  # 10 Mo


class DocumentMedicalScanneSerializer(serializers.ModelSerializer):
    depose_par_username = serializers.SerializerMethodField(read_only=True)
    fichier_url = serializers.SerializerMethodField(read_only=True)
    collaborateur_matricule = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DocumentMedicalScanne
        fields = [
            "id",
            "collaborateur",
            "matricule_ref",
            "collaborateur_matricule",
            "type_document",
            "fichier",
            "fichier_url",
            "titre",
            "commentaire",
            "date_document",
            "depose_par",
            "depose_par_username",
            "date_depot",
        ]
        read_only_fields = [
            "depose_par",
            "date_depot",
            "fichier_url",
            "depose_par_username",
            "collaborateur_matricule",
        ]

    def validate_fichier(self, value):
        if value.size > MAX_FICHIER_OCTETS:
            raise serializers.ValidationError(
                "Fichier trop volumineux. Maximum autorisé : 10 Mo."
            )
        return value

    def validate(self, attrs):
        partial = getattr(self, "partial", False)
        collaborateur = attrs.get("collaborateur")
        matricule_ref = (attrs.get("matricule_ref") or "").strip()
        if partial and self.instance:
            if "collaborateur" not in attrs:
                collaborateur = self.instance.collaborateur
            if not matricule_ref and "matricule_ref" not in attrs:
                matricule_ref = (self.instance.matricule_ref or "").strip()
        if not collaborateur and not matricule_ref:
            raise serializers.ValidationError(
                "Indiquez un collaborateur ou un matricule (candidat)."
            )
        return attrs

    def get_depose_par_username(self, obj):
        if not obj.depose_par_id:
            return None
        return obj.depose_par.get_username()

    def get_collaborateur_matricule(self, obj):
        if obj.collaborateur_id:
            return obj.collaborateur.matricule
        return obj.matricule_ref or None

    def get_fichier_url(self, obj):
        if not obj.fichier:
            return None
        request = self.context.get("request")
        url = obj.fichier.url
        if request:
            return request.build_absolute_uri(url)
        return url

    def create(self, validated_data):
        validated_data["depose_par"] = self.context["request"].user
        mr = validated_data.get("matricule_ref") or ""
        validated_data["matricule_ref"] = mr.strip()
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if "matricule_ref" in validated_data and validated_data["matricule_ref"] is not None:
            validated_data["matricule_ref"] = validated_data["matricule_ref"].strip()
        return super().update(instance, validated_data)
