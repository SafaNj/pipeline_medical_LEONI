import logging

from rest_framework import serializers

from apps.medical_work.models import (
    CertificatAptitude,
    DemandeBilan,
    DemandeExamen,
    FicheAptitude,
    FicheLiaison,
    Ordonnance,
    RemarqueInfirmier,
)
from apps.account.utils import get_im_site_filter_from_request
from apps.employees.models import ResourceIM
from apps.embauche.models import CandidatEmbauche

logger = logging.getLogger(__name__)


def _identity_from_fiche_embauche(fiche, request=None):
    """
    Identité affichée sur demandes examen/bilan quand collaborateur absent (embauche) :
    collaborateur médical_db sinon snapshot matricule + im_db + candidat_embauche (fallback).
    """
    if not fiche:
        return None
    if getattr(fiche, "collaborateur_id", None):
        collab = fiche.collaborateur
        try:
            full = f"{collab.nom} {collab.prenom}".strip()
            return {
                "nom_complet": full or f"Matricule {collab.matricule}",
                "matricule": collab.matricule,
                "cin": getattr(collab, "cin", None),
                "telephone": getattr(collab, "telephone", None),
            }
        except Exception:
            return {
                "nom_complet": None,
                "matricule": getattr(collab, "matricule", None),
                "cin": None,
                "telephone": None,
            }
    matricule = str(getattr(fiche, "matricule", None) or "").strip()
    if not matricule:
        return None
    resource = None
    im_site = get_im_site_filter_from_request(request) if request else False
    if matricule.isdigit() and im_site is not False:
        qs = ResourceIM.objects.using("im_db").filter(matricule=int(matricule))
        if im_site:
            qs = qs.filter(site=im_site)
        resource = qs.first()
    if resource:
        full = f"{resource.name or ''} {resource.firstname or ''}".strip()
        return {
            "nom_complet": full or None,
            "matricule": matricule,
            "cin": resource.CIN,
            "telephone": resource.telephone,
        }
    # Fallback : données du CandidatEmbauche stockées en BD locale
    candidat = (
        CandidatEmbauche.objects
        .filter(matricule=matricule)
        .order_by('-date_creation')
        .first()
    )
    if candidat:
        full = f"{candidat.nom or ''} {candidat.prenom or ''}".strip()
        return {
            "nom_complet": full or None,
            "matricule": matricule,
            "cin": candidat.cin or None,
            "telephone": candidat.telephone or None,
        }
    return {
        "nom_complet": None,
        "matricule": matricule,
        "cin": None,
        "telephone": None,
    }


class CertificatAptitudeSerializer(serializers.ModelSerializer):
    mateur_payload = serializers.SerializerMethodField()

    class Meta:
        model = CertificatAptitude
        fields = "__all__"

    def get_mateur_payload(self, obj):
        mp = getattr(obj, "mateur_payload", None)
        if not mp:
            return None
        return {
            "type_visite": mp.type_visite,
            "aptitude": mp.aptitude,
            "avis": {
                "etat_general_efficience": mp.avis_etat_general_efficience,
                "debout_prolonge": mp.avis_debout_prolonge,
                "assis_prolonge": mp.avis_assis_prolonge,
                "charge_sup_4kg": mp.avis_charge_sup_4kg,
                "poignet_bras_epaule": mp.avis_poignet_bras_epaule,
                "cou": mp.avis_cou,
                "effort_precision_concentration": mp.avis_effort_precision_concentration,
                "rotation_equipe_possible": mp.avis_rotation_equipe_possible,
                "a_prendre_en_consideration": {
                    "maladie_professionnelle": mp.apc_maladie_professionnelle,
                    "accident_travail_sequelles": mp.apc_accident_travail_sequelles,
                    "maladies_chroniques": mp.apc_maladies_chroniques,
                },
            },
            "zones": {
                "coupe": {
                    "coupe": mp.zone_coupe_coupe,
                    "sertissage_manuel": mp.zone_coupe_sertissage_manuel,
                    "autres_remarques": mp.zone_coupe_autres_remarques,
                },
                "preparation": {
                    "epissure": mp.zone_prep_epissure,
                    "retreint": mp.zone_prep_retreint,
                    "torsadage": mp.zone_prep_torsadage,
                    "eiamage": mp.zone_prep_eiamage,
                    "kabatec": mp.zone_prep_kabatec,
                    "lovage": mp.zone_prep_lovage,
                    "autres_remarques": mp.zone_prep_autres_remarques,
                },
                "montage": {
                    "sous_element": mp.zone_montage_sous_element,
                    "montage_lad": mp.zone_montage_lad,
                    "pu": mp.zone_montage_pu,
                    "c_agrafs": mp.zone_montage_c_agrafs,
                    "vissage": mp.zone_montage_vissage,
                    "montage_goulotte": mp.zone_montage_goulotte,
                    "bol": mp.zone_montage_bol,
                    "c_final": mp.zone_montage_c_final,
                    "autre_postes_montage": mp.zone_montage_autre_postes,
                },
            },
            "autres_remarques": mp.autres_remarques,
        }


class DemandeBilanSerializer(serializers.ModelSerializer):
    collaborateur_nom = serializers.SerializerMethodField()
    collaborateur_matricule = serializers.SerializerMethodField()
    collaborateur_cin = serializers.SerializerMethodField()
    collaborateur_gsm = serializers.SerializerMethodField()
    notes = serializers.CharField(source="renseignements_cliniques", read_only=True)
    # `autres_risques` est désormais un texte (pas un booléen)
    autres_risques = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = DemandeBilan
        fields = "__all__"

    def to_internal_value(self, data):
        """
        Compat: certains anciens clients envoyaient `autres_risques` en bool.
        On normalise vers une chaîne.
        """
        if hasattr(data, "copy"):
            data = data.copy()
        else:
            data = dict(data)
        if hasattr(data, "_mutable") and data._mutable is False:
            data._mutable = True
        if "autres_risques" in data and isinstance(data.get("autres_risques"), bool):
            data["autres_risques"] = "OUI" if data["autres_risques"] is True else ""
        return super().to_internal_value(data)

    def get_collaborateur_nom(self, obj):
        if not obj.fiche_aptitude_id:
            return None
        info = _identity_from_fiche_embauche(obj.fiche_aptitude, self.context.get("request"))
        return info.get("nom_complet") if info else None

    def get_collaborateur_matricule(self, obj):
        if not obj.fiche_aptitude_id:
            return None
        info = _identity_from_fiche_embauche(obj.fiche_aptitude, self.context.get("request"))
        return info.get("matricule") if info else None

    def get_collaborateur_cin(self, obj):
        if not obj.fiche_aptitude_id:
            return None
        info = _identity_from_fiche_embauche(obj.fiche_aptitude, self.context.get("request"))
        return info.get("cin") if info else None

    def get_collaborateur_gsm(self, obj):
        if not obj.fiche_aptitude_id:
            return None
        info = _identity_from_fiche_embauche(obj.fiche_aptitude, self.context.get("request"))
        return info.get("telephone") if info else None


class DemandeExamenSerializer(serializers.ModelSerializer):
    collaborateur_nom = serializers.SerializerMethodField()
    collaborateur_matricule = serializers.SerializerMethodField()
    notes = serializers.CharField(source="renseignements_cliniques", read_only=True)

    class Meta:
        model = DemandeExamen
        fields = "__all__"

    def get_collaborateur_nom(self, obj):
        if not obj.fiche_aptitude_id:
            return None
        info = _identity_from_fiche_embauche(obj.fiche_aptitude, self.context.get("request"))
        return info.get("nom_complet") if info else None

    def get_collaborateur_matricule(self, obj):
        if not obj.fiche_aptitude_id:
            return None
        info = _identity_from_fiche_embauche(obj.fiche_aptitude, self.context.get("request"))
        return info.get("matricule") if info else None


class OrdonnanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ordonnance
        fields = "__all__"
        read_only_fields = ["date_creation"]


class FicheLiaisonSerializer(serializers.ModelSerializer):
    class Meta:
        model = FicheLiaison
        fields = "__all__"
        read_only_fields = ["date_creation"]


class RemarqueInfirmierSerializer(serializers.ModelSerializer):
    class Meta:
        model = RemarqueInfirmier
        fields = ['id', 'remarque', 'reevaluation', 'date_creation', 'date_modification']
        read_only_fields = ['id', 'date_creation', 'date_modification']


class FicheAptitudeSerializer(serializers.ModelSerializer):
    # TODO(perf): les champs collaborateur_* reposent sur des propriétés dynamiques de Collaborateur
    # (source im_db) et peuvent provoquer du N+1 sur les listes volumineuses.
    # Prévoir un mécanisme de cache/snapshot SQL si la volumétrie augmente.
    medecin_nom = serializers.SerializerMethodField()
    collaborateur_nom = serializers.SerializerMethodField()
    collaborateur_matricule = serializers.SerializerMethodField()
    collaborateur_poste = serializers.SerializerMethodField()
    collaborateur_cin = serializers.SerializerMethodField()
    collaborateur_date_naissance = serializers.SerializerMethodField()
    collaborateur_lieu_naissance = serializers.SerializerMethodField()
    collaborateur_adresse = serializers.SerializerMethodField()
    collaborateur_cnss = serializers.SerializerMethodField()
    collaborateur_date_recrutement = serializers.SerializerMethodField()
    collaborateur_telephone = serializers.SerializerMethodField()
    site_details = serializers.SerializerMethodField()
    site_nom = serializers.SerializerMethodField()
    site_adresse = serializers.SerializerMethodField()
    site_telephone = serializers.SerializerMethodField()
    site_template_key = serializers.SerializerMethodField()
    site_logo = serializers.SerializerMethodField()
    sms_mateur_payload = serializers.SerializerMethodField()

    certificat = CertificatAptitudeSerializer(read_only=True)
    demandes_bilan = DemandeBilanSerializer(many=True, read_only=True)
    demandes_examen = DemandeExamenSerializer(many=True, read_only=True)
    remarque_infirmier = RemarqueInfirmierSerializer(read_only=True)
    sousse_fields = ["duree_aptitude", "periode_temporaire", "date_reprise"]
    enterprise_required_fields = [
        "raison_sociale",
        "nature_activite",
        "adresse_entreprise",
        "numero_cnss_entreprise",
    ]
    messadine_site_code = "MASSADINE"

    class Meta:
        model = FicheAptitude
        fields = "__all__"
        read_only_fields = [
            "date_creation",
        ]
        extra_kwargs = {
            "medecin_travail": {"required": False},
            "ligne_visite_periodique": {"required": False, "allow_null": True},
        }

    def get_field_names(self, declared_fields, info):
        fields = list(super().get_field_names(declared_fields, info))
        for field_name in self.sousse_fields:
            if field_name not in fields:
                fields.append(field_name)
        return fields

    def get_sms_mateur_payload(self, obj):
        """
        Expose la fiche SMS Mateur (si présente) pour ré-affichage / ré-impression.
        """
        sms = getattr(obj, "sms_mateur", None)
        if not sms:
            return None
        return {
            "motifs": {
                "moins18": sms.motif_moins_18,
                "enceinte_allaitante": sms.motif_enceinte_allaitante,
                "handicape": sms.motif_handicape,
                "travaux_risques_accidents": sms.motif_travaux_risques_accidents,
                "maladie_chronique": sms.motif_maladie_chronique,
                "travaux_maladies_professionnelles": sms.motif_travaux_maladies_professionnelles,
            },
            "poste_caracteristiques": sms.poste_caracteristiques,
            "poste_ergonomie": sms.poste_ergonomie,
            "tache_habituelle": sms.tache_habituelle,
            "risques_accidents": sms.risques_accidents,
            "tableaux_mp_et_agents": sms.tableaux_mp_et_agents,
            "evaluation_exposition": sms.evaluation_exposition,
            "surveillance_rows": sms.surveillance_rows or [],
            "mesures_prevention": sms.mesures_prevention,
            "collaborateur": sms.collaborateur_id,
            "medecin_travail": sms.medecin_travail_id,
        }

    def validate(self, attrs):
        # Robustesse: si le frontend n'envoie pas type_visite, on met un défaut.
        # (notamment Mateur: champ masqué dans l'UI fiche aptitude)
        if self.instance is None:
            tv = attrs.get("type_visite")
            if tv is None or (isinstance(tv, str) and tv.strip() == ""):
                attrs["type_visite"] = "EMBAUCHE"

        # Validation légère du JSON "examens_ulterieurs" (liste de lignes).
        eu = attrs.get("examens_ulterieurs")
        if eu is not None:
            if not isinstance(eu, list):
                raise serializers.ValidationError({"examens_ulterieurs": "Doit être une liste JSON."})
            for i, row in enumerate(eu):
                if not isinstance(row, dict):
                    raise serializers.ValidationError({"examens_ulterieurs": f"Ligne {i+1}: objet invalide."})

        ligne = attrs.get("ligne_visite_periodique")
        if ligne is None and "ligne_visite_periodique" not in attrs and self.instance:
            ligne = self.instance.ligne_visite_periodique
        collab = attrs.get("collaborateur")
        if collab is None and "collaborateur" not in attrs and self.instance:
            collab = self.instance.collaborateur
        if ligne is not None and collab is not None and ligne.collaborateur_id != collab.pk:
            raise serializers.ValidationError(
                {
                    "ligne_visite_periodique": (
                        "La ligne doit concerner le même collaborateur que la fiche."
                    )
                }
            )

        site = self._get_effective_site(attrs)
        if site and not self._is_messadine_site(site):
            errors = {}
            for field_name in self.enterprise_required_fields:
                value = attrs.get(field_name)
                if value is None and self.instance is not None:
                    value = getattr(self.instance, field_name, None)
                # En création, perform_create() auto-injecte ces champs depuis le Site,
                # mais la validation passe avant perform_create(). On accepte donc la
                # valeur qui sera injectée si elle existe sur le site.
                if (value is None or (isinstance(value, str) and value.strip() == "")) and self.instance is None:
                    if field_name == "adresse_entreprise":
                        value = (getattr(site, "adresse_entreprise", "") or "").strip() or (
                            getattr(site, "adresse", "") or ""
                        ).strip()
                    elif field_name == "numero_cnss_entreprise":
                        value = (getattr(site, "numero_cnss_entreprise", "") or "").strip() or (
                            getattr(site, "numero_cnss", "") or ""
                        ).strip()
                    else:
                        value = getattr(site, field_name, None)
                if isinstance(value, str):
                    value = value.strip()
                if not value:
                    errors[field_name] = (
                        "Ce champ est obligatoire pour les sites hors Messadine (Menzel/Mateur)."
                    )
            if errors:
                raise serializers.ValidationError(errors)
        return attrs

    def _get_effective_site(self, attrs):
        site = attrs.get("site")
        if site is not None:
            return site

        if self.instance is not None and self.instance.site_id:
            return self.instance.site

        request = self.context.get("request")
        if not request:
            return None

        from apps.medical_work.permissions import get_request_medecin

        medecin = get_request_medecin(request)
        if medecin and medecin.site_id:
            return medecin.site
        return None

    def _is_messadine_site(self, site):
        if not site:
            return False
        code = (getattr(site, "code", "") or "").strip().upper()
        if code == self.messadine_site_code:
            return True
        nom = (getattr(site, "nom", "") or "").strip().upper()
        return "MASSADINE" in nom

    def create(self, validated_data):
        instance = super().create(validated_data)
        self._sync_ligne_visite_periodique(instance)
        return instance

    def update(self, instance, validated_data):
        old_ligne_pk = instance.ligne_visite_periodique_id
        instance = super().update(instance, validated_data)
        self._sync_ligne_visite_periodique(instance, old_ligne_pk=old_ligne_pk)
        return instance

    def _sync_ligne_visite_periodique(self, fiche, old_ligne_pk=None):
        """Recolle LigneVisitePeriodique.fiche_aptitude quand Fiche.ligne_visite_periodique change."""
        from apps.visites_periodiques.models import LigneVisitePeriodique

        new_pk = fiche.ligne_visite_periodique_id
        if old_ligne_pk and old_ligne_pk != new_pk:
            LigneVisitePeriodique.objects.filter(
                pk=old_ligne_pk, fiche_aptitude_id=fiche.pk
            ).update(fiche_aptitude=None)
        if new_pk:
            prev_fiche_id = (
                LigneVisitePeriodique.objects.filter(pk=new_pk)
                .values_list("fiche_aptitude_id", flat=True)
                .first()
            )
            first_attachment = prev_fiche_id is None
            LigneVisitePeriodique.objects.filter(pk=new_pk).update(fiche_aptitude=fiche)
            if first_attachment and getattr(fiche, "type_visite", None) == "PERIODIQUE":
                try:
                    from apps.visites_periodiques.visite_periodique_sms import (
                        notifier_n_plus_2_apres_fiche_vp,
                    )

                    ligne = LigneVisitePeriodique.objects.select_related(
                        "liste", "collaborateur"
                    ).get(pk=new_pk)
                    notifier_n_plus_2_apres_fiche_vp(ligne)
                except Exception:
                    logger.exception(
                        "SMS visite périodique : échec N+2 après fiche ligne_vp=%s",
                        new_pk,
                    )

    def to_internal_value(self, data):
        """
        Le GET expose `collaborateur_cnss` (SerializerMethodField, lecture seule).
        Les clients envoient souvent ce nom en PATCH/POST au lieu de `numero_cnss` :
        sans mapping, la saisie médecin n'est jamais persistée sur FicheAptitude.numero_cnss.
        """
        if hasattr(data, "copy"):
            data = data.copy()
        else:
            data = dict(data)
        if hasattr(data, "_mutable") and data._mutable is False:
            data._mutable = True
        if "numero_cnss" not in data and "collaborateur_cnss" in data:
            data["numero_cnss"] = data.get("collaborateur_cnss")
        if "numero_cnss" not in data and "cnss" in data:
            data["numero_cnss"] = data.get("cnss")
        for alias in ("collaborateur_cnss", "cnss"):
            data.pop(alias, None)
        # Ancien nom éventuel côté front (embauche / legacy)
        if (
            "observations_complementaires" not in data
            and "observations_medecin" in data
        ):
            data["observations_complementaires"] = data.get("observations_medecin")
        data.pop("observations_medecin", None)
        return super().to_internal_value(data)

    def _get_im_resource(self, obj):
        """
        Cherche la ressource im_db dans deux cas :
        1. Collaborateur lié -> utilise son matricule
        2. Visite d'embauche sans collaborateur -> utilise le champ matricule stocke sur la fiche
        """
        matricule = None
        if obj.collaborateur_id:
            matricule = str(obj.collaborateur.matricule or "").strip()
        elif getattr(obj, 'matricule', None):
            matricule = str(obj.matricule or "").strip()
        if not matricule or not matricule.isdigit():
            return None
        req = self.context.get("request")
        im_site = get_im_site_filter_from_request(req) if req else False
        if im_site is False:
            return None
        qs = ResourceIM.objects.using("im_db").filter(matricule=int(matricule))
        if im_site:
            qs = qs.filter(site=im_site)
        return qs.first()

    def _get_candidat_embauche(self, obj):
        """
        Pour les fiches embauche sans collaborateur lié :
        cherche le CandidatEmbauche le plus récent avec ce matricule.
        Utilisé comme fallback quand im_db ne contient pas encore le matricule.
        """
        if obj.collaborateur_id:
            return None
        matricule = str(getattr(obj, 'matricule', None) or '').strip()
        if not matricule:
            return None
        return (
            CandidatEmbauche.objects
            .filter(matricule=matricule)
            .order_by('-date_creation')
            .first()
        )

    def get_medecin_nom(self, obj):
        if not obj.medecin_travail_id or not obj.medecin_travail.profile_id:
            return None
        user = obj.medecin_travail.profile.user
        return user.get_full_name() or user.username

    def get_collaborateur_matricule(self, obj):
        if obj.collaborateur_id:
            return obj.collaborateur.matricule
        # Cas embauche : matricule snapshot sur la fiche
        return getattr(obj, 'matricule', None) or None

    def get_collaborateur_nom(self, obj):
        # Cas normal : collaborateur lié en BD
        if obj.collaborateur_id:
            try:
                full_name = f"{obj.collaborateur.nom} {obj.collaborateur.prenom}".strip()
                return full_name or f"Matricule {obj.collaborateur.matricule}"
            except Exception:
                return f"Matricule {obj.collaborateur.matricule}"
        # Cas embauche : cherche dans im_db
        resource = self._get_im_resource(obj)
        if resource:
            full_name = f"{resource.name or ''} {resource.firstname or ''}".strip()
            if full_name:
                return full_name
        # Fallback : données du CandidatEmbauche (stockées en BD locale)
        candidat = self._get_candidat_embauche(obj)
        if candidat:
            full_name = f"{candidat.nom or ''} {candidat.prenom or ''}".strip()
            if full_name:
                return full_name
        return None

    def get_collaborateur_poste(self, obj):
        if obj.collaborateur_id:
            try:
                return obj.collaborateur.poste
            except Exception:
                return None
        # Cas embauche : cherche dans im_db
        resource = self._get_im_resource(obj)
        if resource and resource.fonction:
            return resource.fonction
        # Fallback : données du CandidatEmbauche
        candidat = self._get_candidat_embauche(obj)
        if candidat and candidat.poste:
            return candidat.poste
        return None

    def get_collaborateur_date_naissance(self, obj):
        if obj.collaborateur_id:
            try:
                return obj.collaborateur.date_naissance
            except Exception:
                return None
        # Cas embauche : cherche dans im_db
        resource = self._get_im_resource(obj)
        if resource and resource.date_naissance:
            return resource.date_naissance
        return None

    def get_collaborateur_lieu_naissance(self, obj):
        if obj.collaborateur_id:
            try:
                lieu = obj.collaborateur.lieu_naissance
                if lieu:
                    return lieu
            except Exception:
                pass
        resource = self._get_im_resource(obj)
        if resource:
            return resource.lieu_naissance
        return None

    def get_collaborateur_adresse(self, obj):
        resource = self._get_im_resource(obj)
        if not resource:
            return None
        return resource.adress

    def _candidat_cnss_by_fiche_matricule(self, obj):
        """Embauche sans collaborateur : CNSS saisi sur le candidat (même matricule que la fiche)."""
        matricule = str(getattr(obj, "matricule", None) or "").strip()
        if not matricule:
            return ""
        cand = (
            CandidatEmbauche.objects.filter(matricule=matricule)
            .order_by("-date_creation")
            .first()
        )
        if cand and (getattr(cand, "numero_cnss", None) or "").strip():
            return cand.numero_cnss.strip()
        return ""

    def get_collaborateur_cnss(self, obj):
        # 1) Saisie sur la fiche (médecin)
        v = (getattr(obj, "numero_cnss", None) or "").strip()
        if v:
            return v
        # 2) Collaborateur medical_db
        if obj.collaborateur_id:
            try:
                cn = (obj.collaborateur.numero_cnss or "").strip()
                if cn:
                    return cn
            except Exception:
                pass
        # 3) Sans collaborateur : candidat embauche par matricule (snapshot fiche)
        if not obj.collaborateur_id:
            cn_cand = self._candidat_cnss_by_fiche_matricule(obj)
            if cn_cand:
                return cn_cand
        # 4) im_db
        resource = self._get_im_resource(obj)
        if resource and resource.CNSS:
            return (resource.CNSS or "").strip() or None
        return None

    def get_collaborateur_cin(self, obj):
        resource = self._get_im_resource(obj)
        if not resource:
            return None
        return resource.CIN

    def get_collaborateur_date_recrutement(self, obj):
        if obj.collaborateur_id:
            try:
                return obj.collaborateur.date_embauche
            except Exception:
                return None
        # Cas embauche : cherche dans im_db
        resource = self._get_im_resource(obj)
        if resource:
            return resource.date_embauche or None
        return None

    def get_collaborateur_telephone(self, obj):
        if obj.collaborateur_id:
            try:
                return obj.collaborateur.telephone
            except Exception:
                return None
        # Cas embauche : cherche dans im_db
        resource = self._get_im_resource(obj)
        if resource:
            return resource.telephone or None
        return None

    def get_site_nom(self, obj):
        return obj.site.nom if obj.site else None

    def get_site_adresse(self, obj):
        return obj.site.adresse if obj.site else None

    def get_site_telephone(self, obj):
        return obj.site.telephone if obj.site else None

    def get_site_template_key(self, obj):
        return obj.site.template_key if obj.site else None

    def get_site_logo(self, obj):
        if not obj.site or not obj.site.logo:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.site.logo.url)
        return obj.site.logo.url

    def get_site_details(self, obj):
        if not obj.site:
            return None
        return {
            'id': obj.site_id,
            'nom': obj.site.nom,
            'nom_ar': obj.site.nom_ar,
            'logo_url': self.get_site_logo(obj),
            'adresse': obj.site.adresse,
            'telephone': obj.site.telephone,
            'code': obj.site.code,
            'template_key': obj.site.template_key,
        }

    def get_site_cnss(self, obj):
        if obj.site:
            return (getattr(obj.site, "numero_cnss_entreprise", "") or "").strip() or (obj.site.numero_cnss or "")
        return ""

    def get_site_nature_activite(self, obj):
        if obj.site:
            return obj.site.nature_activite
        return ""


class FicheAptitudeRHSerializer(FicheAptitudeSerializer):
    """
    Serializer FicheAptitude pour le rôle RH.
    Les demandes de bilan et d'examen (données médicales confidentielles)
    sont exclues — elles ne doivent pas être visibles par les RH.
    """
    demandes_bilan = None
    demandes_examen = None

    class Meta(FicheAptitudeSerializer.Meta):
        fields = "__all__"

    def get_field_names(self, declared_fields, info):
        fields = super().get_field_names(declared_fields, info)
        for f in ("demandes_bilan", "demandes_examen"):
            if f in fields:
                fields.remove(f)
        return fields