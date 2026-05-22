from rest_framework import serializers

from apps.consultations.models import CertificatPermisConduire


class CertificatPermisConduireSerializer(serializers.ModelSerializer):
    # Legacy fields removed from the model but potentially still sent by old frontend forms.
    LEGACY_REMOVED_FIELDS = {
        "adresse_medecin",
        "ville_medecin",
        "gouvernorat_medecin",
        "categories",
        "decision",
        "specialite_renvoi",
        "duree_validite",
    }
    groupe_permis = serializers.CharField()

    class Meta:
        model = CertificatPermisConduire
        fields = "__all__"
        read_only_fields = (
            "date_emission",
            "nom_prenom_medecin",
            "nom_prenom",
            "date_naissance",
            "lieu_naissance",
            "adresse_residence",
        )

    def to_internal_value(self, data):
        payload = data.copy()
        for field in self.LEGACY_REMOVED_FIELDS:
            payload.pop(field, None)
        return super().to_internal_value(payload)

    def validate(self, attrs):
        data = attrs.copy()
        if self.instance:
            for key in (
                "examine_par_specialiste",
                "examine_par_specialiste_type",
                "certificat_delivre_par_specialiste",
                "certificat_delivre_par_specialiste_type",
                "inapte_conduite",
                "inapte_conduite_raison",
            ):
                data.setdefault(key, getattr(self.instance, key, None))
        if "groupe_permis" in attrs:
            raw_group = str(attrs.get("groupe_permis") or "").strip()
            raw_group = raw_group.strip('"').strip("'").strip().lower()
            group_aliases = {
                "groupe_1": "groupe_1",
                "groupe 1": "groupe_1",
                "group_1": "groupe_1",
                "group 1": "groupe_1",
                "groupe_2": "groupe_2",
                "groupe 2": "groupe_2",
                "group_2": "groupe_2",
                "group 2": "groupe_2",
                "les_deux": "les_deux",
                "les deux": "les_deux",
            }
            normalized_group = group_aliases.get(raw_group)
            if not normalized_group:
                raise serializers.ValidationError(
                    {"groupe_permis": "Valeur invalide. Utiliser: groupe_1, groupe_2, ou les_deux."}
                )
            attrs["groupe_permis"] = normalized_group

        if data.get("examine_par_specialiste") and not str(data.get("examine_par_specialiste_type") or "").strip():
            raise serializers.ValidationError(
                {"examine_par_specialiste_type": "Ce champ est obligatoire si la case est cochée."}
            )
        if data.get("certificat_delivre_par_specialiste") and not str(data.get("certificat_delivre_par_specialiste_type") or "").strip():
            raise serializers.ValidationError(
                {"certificat_delivre_par_specialiste_type": "Ce champ est obligatoire si la case est cochée."}
            )
        if data.get("inapte_conduite") and not str(data.get("inapte_conduite_raison") or "").strip():
            raise serializers.ValidationError(
                {"inapte_conduite_raison": "Ce champ est obligatoire si la case est cochée."}
            )

        # If checkbox is unchecked, clear associated details to keep stored data coherent.
        if "examine_par_specialiste" in attrs and not attrs.get("examine_par_specialiste"):
            attrs["examine_par_specialiste_type"] = ""
        if "certificat_delivre_par_specialiste" in attrs and not attrs.get("certificat_delivre_par_specialiste"):
            attrs["certificat_delivre_par_specialiste_type"] = ""
        if "inapte_conduite" in attrs and not attrs.get("inapte_conduite"):
            attrs["inapte_conduite_raison"] = ""

        return attrs
