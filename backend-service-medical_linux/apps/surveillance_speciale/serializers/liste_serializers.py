from __future__ import annotations

from rest_framework import serializers

from apps.employees.models import Collaborateur
from apps.surveillance_speciale.models import LigneSurveillanceSpeciale, ListeSurveillanceSpeciale


def _validate_ligne_matricule_collaborateur(attrs: dict, instance: LigneSurveillanceSpeciale | None) -> dict:
    """Résolution matricule + doublons ; utilisé par le serializer principal et le serializer de création."""
    attrs = dict(attrs)
    matricule = attrs.pop("matricule", None)
    if matricule is not None:
        matricule = str(matricule).strip() or None

    if attrs.get("collaborateur") is None:
        attrs.pop("collaborateur", None)

    collab_actuel = attrs.get("collaborateur")
    if matricule and collab_actuel is None:
        collab = _collaborateur_depuis_matricule(matricule)
        if not collab:
            raise serializers.ValidationError(
                {"matricule": f"Aucun collaborateur avec le matricule {matricule!r}."}
            )
        attrs["collaborateur"] = collab

    if instance is None and not attrs.get("collaborateur"):
        raise serializers.ValidationError(
            {"matricule": "Fournissez un matricule existant ou un id collaborateur."}
        )
    liste = attrs.get("liste") or (instance.liste if instance else None)
    collab = attrs.get("collaborateur") or (instance.collaborateur if instance else None)
    if liste and collab:
        dup = LigneSurveillanceSpeciale.objects.filter(liste=liste, collaborateur=collab)
        if instance:
            dup = dup.exclude(pk=instance.pk)
        if dup.exists():
            raise serializers.ValidationError(
                {"matricule": "Ce collaborateur est déjà présent dans cette liste."}
            )
    return attrs


def _collaborateur_depuis_matricule(matricule) -> Collaborateur | None:
    """Résout le collaborateur ; tolère espaces et matricule numérique JSON."""
    if matricule is None:
        return None
    m = str(matricule).strip()
    if not m:
        return None
    c = Collaborateur.objects.filter(matricule=m).first()
    if c:
        return c
    if m.isdigit():
        c = Collaborateur.objects.filter(matricule=str(int(m))).first()
        if c:
            return c
    return Collaborateur.objects.filter(matricule__iexact=m).first()


class LigneSurveillanceSpecialeCreateSerializer(serializers.Serializer):
    """
    Création POST : `serializers.Serializer` uniquement — pas de ModelSerializer,
    sinon DRF réinjecte collaborateur / ordre du modèle comme champs requis.
    """

    liste = serializers.PrimaryKeyRelatedField(
        queryset=ListeSurveillanceSpeciale.objects.all(),
        required=True,
    )
    matricule = serializers.CharField(write_only=True, required=False, allow_blank=True)
    collaborateur = serializers.PrimaryKeyRelatedField(
        queryset=Collaborateur.objects.all(),
        required=False,
        allow_null=True,
    )
    presence = serializers.ChoiceField(
        choices=LigneSurveillanceSpeciale.PRESENCE_CHOICES,
        required=False,
        default=LigneSurveillanceSpeciale.PRESENCE_EN_ATTENTE,
    )
    raison_report = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, attrs):
        return _validate_ligne_matricule_collaborateur(attrs, instance=None)

    def create(self, validated_data):
        liste = validated_data["liste"]
        validated_data.pop("matricule", None)
        collaborateur = validated_data["collaborateur"]
        ordre = LigneSurveillanceSpeciale.prochain_ordre_pour_liste(liste)
        presence = validated_data.get(
            "presence", LigneSurveillanceSpeciale.PRESENCE_EN_ATTENTE
        )
        raison_report = validated_data.get("raison_report", "")
        return LigneSurveillanceSpeciale.objects.create(
            liste=liste,
            collaborateur=collaborateur,
            ordre=ordre,
            presence=presence,
            raison_report=raison_report,
        )


class LigneSurveillanceSpecialeSerializer(serializers.ModelSerializer):
    collaborateur_nom = serializers.SerializerMethodField(read_only=True)
    collaborateur_prenom = serializers.SerializerMethodField(read_only=True)
    collaborateur_matricule = serializers.SerializerMethodField(read_only=True)
    fiche_aptitude = serializers.SerializerMethodField(read_only=True)
    matricule = serializers.CharField(write_only=True, required=False, allow_blank=True)
    # Surcharge explicite : sinon DRF exige collaborateur (FK non blank) avant validate().
    collaborateur = serializers.PrimaryKeyRelatedField(
        queryset=Collaborateur.objects.all(),
        required=False,
        allow_null=True,
    )
    # La vue injecte aussi `liste` dans le payload avant is_valid().
    liste = serializers.PrimaryKeyRelatedField(
        queryset=ListeSurveillanceSpeciale.objects.all(),
        required=False,
    )
    # Surcharge : sur le modèle ordre n'a pas blank=True → DRF le garde « required » sans ceci.
    ordre = serializers.IntegerField(required=False, min_value=1, allow_null=True)

    class Meta:
        model = LigneSurveillanceSpeciale
        fields = [
            "id",
            "liste",
            "collaborateur",
            "matricule",
            "ordre",
            "presence",
            "raison_report",
            "traitement_termine",
            "remarque_medecin",
            "sms_jour_j_envoye",
            "fiche_aptitude",
            "collaborateur_nom",
            "collaborateur_prenom",
            "collaborateur_matricule",
        ]
        read_only_fields = [
            "traitement_termine",
            "sms_jour_j_envoye",
        ]

    def get_collaborateur_nom(self, obj):
        if not obj.collaborateur_id:
            return None
        nom = (getattr(obj.collaborateur, "nom", "") or "").strip()
        prenom = (getattr(obj.collaborateur, "prenom", "") or "").strip()
        return f"{nom} {prenom}".strip() or None

    def get_collaborateur_prenom(self, obj):
        if not obj.collaborateur_id:
            return None
        return (getattr(obj.collaborateur, "prenom", "") or "").strip() or None

    def get_collaborateur_matricule(self, obj):
        if not obj.collaborateur_id:
            return None
        return obj.collaborateur.matricule

    def get_fiche_aptitude(self, obj):
        """
        La relation est portée par medical_work.FicheAptitude.ligne_surveillance_speciale
        (related_name='fiches_aptitude'). On expose ici l'id (int) ou null.
        """
        rel = getattr(obj, "fiches_aptitude", None)
        if rel is None:
            return None
        fa = rel.order_by("-pk").only("id").first()
        return fa.id if fa else None

    def validate(self, attrs):
        return _validate_ligne_matricule_collaborateur(attrs, instance=self.instance)

    def create(self, validated_data):
        liste = validated_data["liste"]
        ordre = validated_data.pop("ordre", None)
        if ordre is None:
            validated_data["ordre"] = LigneSurveillanceSpeciale.prochain_ordre_pour_liste(liste)
        else:
            if LigneSurveillanceSpeciale.objects.filter(liste=liste, ordre=ordre).exists():
                raise serializers.ValidationError(
                    {"ordre": "Ce rang est déjà utilisé dans cette liste."}
                )
            validated_data["ordre"] = ordre
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop("matricule", None)
        liste = validated_data.get("liste", instance.liste)
        new_ordre = validated_data.get("ordre", instance.ordre)
        if "ordre" in validated_data or "liste" in validated_data:
            qs = (
                LigneSurveillanceSpeciale.objects.filter(liste=liste, ordre=new_ordre)
                .exclude(pk=instance.pk)
            )
            if qs.exists():
                raise serializers.ValidationError(
                    {"ordre": "Ce rang est déjà utilisé dans cette liste."}
                )
        return super().update(instance, validated_data)


class ListeSurveillanceSpecialeSerializer(serializers.ModelSerializer):
    medecin_nom = serializers.SerializerMethodField(read_only=True)
    nombre_lignes = serializers.SerializerMethodField(read_only=True)
    nombre_traites = serializers.SerializerMethodField(read_only=True)
    nombre_absents = serializers.SerializerMethodField(read_only=True)
    nombre_reportes = serializers.SerializerMethodField(read_only=True)
    lignes = LigneSurveillanceSpecialeSerializer(many=True, read_only=True)

    class Meta:
        model = ListeSurveillanceSpeciale
        fields = "__all__"
        read_only_fields = [
            "reference",
            "date_creation",
            "date_modification",
            "cree_par",
            "sms_veille_envoye",
        ]

    def get_medecin_nom(self, obj):
        if not obj.medecin_id:
            return None
        medecin = obj.medecin
        user = getattr(getattr(medecin, "profile", None), "user", None)
        if user:
            full = (user.get_full_name() or "").strip()
            if full:
                return full
            if user.username:
                return user.username
        if medecin.nom_ar:
            return medecin.nom_ar
        return f"Médecin #{medecin.id}"

    def get_nombre_lignes(self, obj):
        return obj.lignes.count()

    def get_nombre_traites(self, obj):
        return obj.lignes.filter(traitement_termine=True).count()

    def get_nombre_absents(self, obj):
        return obj.lignes.filter(presence=LigneSurveillanceSpeciale.PRESENCE_ABSENT).count()

    def get_nombre_reportes(self, obj):
        return obj.lignes.filter(presence=LigneSurveillanceSpeciale.PRESENCE_REPORTE).count()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Discriminateur stable (évite de confondre avec les ids de listes VP sur le tableau de bord)
        data["flux"] = "SMS"
        data["type_liste"] = "SURVEILLANCE_SPECIALE"
        return data
