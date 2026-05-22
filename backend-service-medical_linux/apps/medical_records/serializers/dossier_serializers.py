# medical_records/serializers/dossier_serializers.py
from datetime import date

from rest_framework import serializers

from apps.account.utils import get_im_site_filter_from_request
from apps.employees.models import Collaborateur
from apps.embauche.models import CandidatEmbauche
from apps.employees.models import ResourceIM
from apps.medical_records.models import DossierMedical


class DossierMedicalListSerializer(serializers.ModelSerializer):
    """Champs minimaux pour la liste."""

    collaborateur_nom = serializers.SerializerMethodField(read_only=True)
    collaborateur_matricule = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DossierMedical
        fields = [
            "id", "collaborateur", "matricule_ref",
            "collaborateur_nom", "collaborateur_matricule",
            "nom", "prenom", "groupe_sanguin", "date_creation",
        ]

    def get_collaborateur_nom(self, obj):
        return f"{obj.nom or ''} {obj.prenom or ''}".strip() or None

    def get_collaborateur_matricule(self, obj):
        if obj.collaborateur_id:
            return obj.collaborateur.matricule
        return None


class DossierMedicalDetailSerializer(serializers.ModelSerializer):
    """Tous les champs + champs calculés read-only."""

    collaborateur_nom = serializers.SerializerMethodField(read_only=True)
    collaborateur_matricule = serializers.SerializerMethodField(read_only=True)
    scans = serializers.SerializerMethodField(read_only=True)
    # Libellé explicite pour l'UI (ex. distribution médicaments) : même source que le champ « allergies » du dossier
    type_allergie = serializers.SerializerMethodField(read_only=True)

    # Déclaré explicitement : DRF peut marquer required=True sur un OneToOneField
    # même avec null=True sur le modèle. Ici on l'accepte en lecture/écriture
    # mais on le rend optionnel (cas embauche : pas encore de collaborateur).
    collaborateur = serializers.PrimaryKeyRelatedField(
        queryset=Collaborateur.objects.all(),
        allow_null=True,
        required=False,
    )

    class Meta:
        model = DossierMedical
        fields = [
            "id",
            "collaborateur",
            "matricule_ref",
            "site",
            "nom",
            "prenom",
            "date_naissance",
            "lieu_naissance",
            "adresse",
            "photo",
            "antecedents_medicaux",
            "antecedents_chirurgicaux",
            "antecedents_gyneco",
            "antecedents_familiaux",
            "vaccin_tuberculose",
            "vaccin_tetanos",
            "vaccin_hepatite",
            "autres_vaccins",
            "groupe_sanguin",
            "allergies",
            "type_allergie",
            "tabac",
            "alcool",
            "automedication",
            "date_creation",
            "date_modification",
            "collaborateur_nom",
            "collaborateur_matricule",
            "scans",
        ]

    def get_type_allergie(self, obj):
        text = (getattr(obj, "allergies", None) or "").strip()
        return text or None

    def get_scans(self, obj):
        from apps.act_infirmier.document_scan_query import (
            queryset_documents_pour_utilisateur,
            queryset_scans_pour_dossier,
        )
        from apps.act_infirmier.serializers.document_medical_scanne_serializers import (
            DocumentMedicalScanneSerializer,
        )

        qs = queryset_scans_pour_dossier(obj.collaborateur_id, obj.matricule_ref)
        request = self.context.get("request")
        if request and getattr(request, "user", None) and request.user.is_authenticated:
            qs = queryset_documents_pour_utilisateur(qs, request.user)
        return DocumentMedicalScanneSerializer(qs, many=True, context=self.context).data

    def get_collaborateur_nom(self, obj):
        if not obj.collaborateur_id:
            return f"{obj.nom or ''} {obj.prenom or ''}".strip() or None

        try:
            full_name = f"{obj.collaborateur.nom} {obj.collaborateur.prenom}".strip()
            return full_name or (f"{obj.nom or ''} {obj.prenom or ''}".strip() or None)
        except Exception:
            # Fallback robuste: le dossier medical reste lisible meme si im_db est indisponible.
            return f"{obj.nom or ''} {obj.prenom or ''}".strip() or None

    def get_collaborateur_matricule(self, obj):
        if obj.collaborateur_id:
            return obj.collaborateur.matricule
        return None

    def validate_groupe_sanguin(self, value):
        # Chaîne vide ou None → None (ChoiceField DRF rejette '' même avec blank=True)
        if not value:
            return None
        valid_groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
        if value not in valid_groups:
            raise serializers.ValidationError(
                f"Groupe sanguin invalide. Valeurs acceptées : {', '.join(valid_groups)}"
            )
        return value

    def validate_date_naissance(self, value):
        if not value:
            return value
        today = date.today()
        if value > today:
            raise serializers.ValidationError("La date de naissance ne peut pas être dans le futur.")
        age = today.year - value.year - (
            (today.month, today.day) < (value.month, value.day)
        )
        if age < 16:
            raise serializers.ValidationError("Âge minimum 16 ans.")
        if age > 70:
            raise serializers.ValidationError("Âge maximum 70 ans.")
        return value


class DossierMedicalCreateFromMatriculeSerializer(serializers.ModelSerializer):
    """
    Serializer minimal pour créer un dossier médical à partir d'un matricule (visite embauche).
    Le frontend peut envoyer uniquement : { matricule_ref: "123" } (ou { matricule: "123" }).
    """

    matricule = serializers.CharField(write_only=True, required=False, allow_blank=True)
    matricule_ref = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    collaborateur = serializers.PrimaryKeyRelatedField(
        queryset=Collaborateur.objects.all(),
        allow_null=True,
        required=False,
    )
    nom = serializers.CharField(required=False, allow_blank=True, default="")
    prenom = serializers.CharField(required=False, allow_blank=True, default="")

    class Meta:
        model = DossierMedical
        fields = ("id", "collaborateur", "matricule", "matricule_ref", "site", "nom", "prenom")
        read_only_fields = ("id",)

    def validate(self, attrs):
        matricule_ref = (attrs.get("matricule_ref") or "").strip()
        matricule_alias = (attrs.pop("matricule", "") or "").strip()
        if not matricule_ref and matricule_alias:
            matricule_ref = matricule_alias
            attrs["matricule_ref"] = matricule_ref

        if not matricule_ref and not attrs.get("collaborateur"):
            raise serializers.ValidationError(
                {"matricule_ref": "matricule_ref (ou collaborateur) est requis."}
            )

        # Normalisation : si on a un collaborateur, on peut prendre son matricule comme ref
        collab = attrs.get("collaborateur")
        if collab and not matricule_ref:
            attrs["matricule_ref"] = str(collab.matricule).strip()

        return attrs

    def _autofill_from_sources(self, matricule_ref):
        """
        Retourne un dict {nom, prenom} depuis embauche ou im_db si dispo.
        """
        m = (matricule_ref or "").strip()
        if not m:
            return {}

        cand = (
            CandidatEmbauche.objects.filter(matricule=m)
            .order_by("-date_creation")
            .first()
        )
        if cand and ((cand.nom or "").strip() or (cand.prenom or "").strip()):
            return {
                "nom": (cand.nom or "").strip(),
                "prenom": (cand.prenom or "").strip(),
            }

        request = self.context.get("request")
        im_site = get_im_site_filter_from_request(request) if request else False
        if m.isdigit() and im_site is not False:
            qs = ResourceIM.objects.using("im_db").filter(matricule=int(m))
            if im_site:
                qs = qs.filter(site=im_site)
            res = qs.first()
            if res and ((res.name or "").strip() or (res.firstname or "").strip()):
                return {
                    "nom": (res.name or "").strip(),
                    "prenom": (res.firstname or "").strip(),
                }

        return {}

    def create(self, validated_data):
        matricule_ref = (validated_data.get("matricule_ref") or "").strip()
        if matricule_ref:
            existing = DossierMedical.objects.filter(matricule_ref=matricule_ref).first()
            if existing:
                return existing

        # Remplir nom/prenom si pas fournis (pour éviter 400 car champs requis sur le modèle)
        nom = (validated_data.get("nom") or "").strip()
        prenom = (validated_data.get("prenom") or "").strip()
        if not nom and not prenom:
            autofill = self._autofill_from_sources(matricule_ref)
            validated_data["nom"] = autofill.get("nom", "") or ""
            validated_data["prenom"] = autofill.get("prenom", "") or ""

        # Dernier filet de sécurité : valeurs non nulles
        validated_data["nom"] = validated_data.get("nom") or ""
        validated_data["prenom"] = validated_data.get("prenom") or ""

        return super().create(validated_data)