# apps/medical_work/views/medical_work_viewsets.py
#
# FIX 403 : La lecture des fiches d'aptitude est désormais accessible
# au rôle RH (en plus des médecins et infirmiers).
#
from datetime import timedelta
import json

from django.db.models import Count, Max, Q
from django.utils import timezone
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.account.models import Medecin
from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import (
    filter_queryset_by_user_site,
    get_im_site_filter_from_request,
    get_site_utilisateur,
)
from apps.consultations.permissions import IsAnyMedecin
from apps.embauche.permissions import IsRH
from apps.embauche.models import CandidatEmbauche
from apps.employees.models import Collaborateur
from apps.medical_records.models import DossierMedical
from apps.medical_records.serializers import DossierMedicalDetailSerializer
from apps.medical_work.models import (
    CertificatAptitude,
    DemandeBilan,
    DemandeExamen,
    FicheAptitude,
    FicheSurveillanceSpecialeMateur,
    FicheLiaison,
    Ordonnance,
    RemarqueInfirmier,
)
from apps.medical_work.permissions import IsMedecinTravail
from apps.medical_work.permissions import IsSameSiteOrAssignedMedecin, get_request_medecin
from apps.medical_work.querysets import filter_fiches_collaborateur_in_im_db
from apps.medical_work.serializers import (
    CertificatAptitudeSerializer,
    DemandeBilanSerializer,
    DemandeExamenSerializer,
    FicheLiaisonSerializer,
    FicheAptitudeSerializer,
    FicheAptitudeRHSerializer,
    OrdonnanceSerializer,
    RemarqueInfirmierSerializer,
)
from .mixins import SiteScopedObjectMixin
from apps.medical_work.alertes_vp_rh import compute_alertes_visite_periodique_rh


class IsAnyMedecinOrRH(IsAnyMedecin):
    """
    Lecture de FicheAptitude : médecins, infirmiers ET RH.
    Hérite de IsAnyMedecin et ajoute le rôle rh.
    """
    def has_permission(self, request, view):
        if super().has_permission(request, view):
            return True
        return IsRH().has_permission(request, view)


class FicheAptitudeViewSet(SiteScopedObjectMixin, viewsets.ModelViewSet):
    queryset = FicheAptitude.objects.select_related(
        "collaborateur",
        "site",
        "medecin_travail",
        "medecin_travail__profile",
        "medecin_travail__profile__user",
        "ligne_visite_periodique",
        "ligne_visite_periodique__liste",
    ).prefetch_related(
        "demandes_bilan",
        "demandes_examen",
        "remarque_infirmier",
    )
    serializer_class = FicheAptitudeSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        medecin = get_request_medecin(self.request)
        if medecin and medecin.site_id:
            queryset = queryset.filter(medecin_travail=medecin)
        return filter_queryset_by_user_site(queryset, self.request.user)

    def get_permissions(self):
        base_permissions = [MustChangePasswordPermission, IsAuthenticated, IsSameSiteOrAssignedMedecin]

        if self.action == "sans_visite_periodique":
            specific_permissions = [IsRH]
        elif self.action in (
            "create",
            "update",
            "partial_update",
            "destroy",
            "rattacher_ligne",
        ):
            # Seul le médecin du travail peut créer / modifier / supprimer
            specific_permissions = [IsMedecinTravail]
        else:
            # Lecture : médecins, infirmiers ET RH
            specific_permissions = [IsAnyMedecinOrRH]   # ← MODIFIÉ

        permissions = [*base_permissions, *specific_permissions]
        return [permission() for permission in permissions]

    def get_serializer_class(self):
        from apps.medical_work.serializers import FicheAptitudeRHSerializer

        if IsRH().has_permission(self.request, self):
            return FicheAptitudeRHSerializer
        return FicheAptitudeSerializer

    def _sync_numero_cnss_to_collaborateur(self, fiche):
        """Recopie le CNSS salarié saisi sur la fiche vers Collaborateur.medical_db."""
        cnss = (getattr(fiche, "numero_cnss", None) or "").strip()
        if not cnss or not fiche.collaborateur_id:
            return
        collab = fiche.collaborateur
        if (collab.numero_cnss or "").strip() == cnss:
            return
        Collaborateur.objects.filter(pk=collab.pk).update(numero_cnss=cnss)

    def _sync_sms_mateur_payload(self, fiche, raw_payload=None):
        """
        Pour SURVEILLANCE_SPECIALE + site template MATEUR:
        persiste les champs de la fiche SMS dans la table dédiée.

        raw_payload:
          - dict envoyé par le client (sms_mateur_payload)
          - OU None -> on tente de parser fiche.observations_complementaires JSON (__sms_mateur_v1).
        """
        try:
            if not fiche or fiche.type_visite != "SURVEILLANCE_SPECIALE":
                return
            if not fiche.site_id or not getattr(fiche.site, "template_key", None) == "MATEUR":
                return

            payload = None
            if isinstance(raw_payload, dict):
                payload = raw_payload
            elif raw_payload:
                # string JSON possible
                try:
                    payload = json.loads(raw_payload)
                except Exception:
                    payload = None

            if payload is None:
                raw = (fiche.observations_complementaires or "").strip()
                if raw:
                    try:
                        parsed = json.loads(raw)
                        payload = parsed.get("__sms_mateur_v1") if isinstance(parsed, dict) else None
                    except Exception:
                        payload = None

            if not isinstance(payload, dict):
                return

            motifs = payload.get("motifs") if isinstance(payload.get("motifs"), dict) else {}
            rows = payload.get("surveillance_rows")
            if rows is not None and not isinstance(rows, list):
                rows = []

            obj, _ = FicheSurveillanceSpecialeMateur.objects.get_or_create(
                fiche_aptitude=fiche,
                defaults={
                    "medecin_travail": fiche.medecin_travail,
                    "collaborateur": fiche.collaborateur,
                },
            )
            # Toujours resynchroniser relations (demandé: collab + medecin)
            obj.medecin_travail = fiche.medecin_travail
            obj.collaborateur = fiche.collaborateur

            obj.motif_moins_18 = bool(motifs.get("moins18"))
            obj.motif_enceinte_allaitante = bool(motifs.get("enceinte_allaitante"))
            obj.motif_handicape = bool(motifs.get("handicape"))
            obj.motif_travaux_risques_accidents = bool(motifs.get("travaux_risques_accidents"))
            obj.motif_maladie_chronique = bool(motifs.get("maladie_chronique"))
            obj.motif_travaux_maladies_professionnelles = bool(motifs.get("travaux_maladies_professionnelles"))

            obj.poste_caracteristiques = str(payload.get("poste_caracteristiques") or "")
            obj.poste_ergonomie = str(payload.get("poste_ergonomie") or "")
            obj.tache_habituelle = str(payload.get("tache_habituelle") or "")

            obj.risques_accidents = str(payload.get("risques_accidents") or "")
            obj.tableaux_mp_et_agents = str(payload.get("tableaux_mp_et_agents") or "")
            obj.evaluation_exposition = str(payload.get("evaluation_exposition") or "")

            obj.surveillance_rows = rows or []
            obj.mesures_prevention = str(payload.get("mesures_prevention") or "")

            obj.save()
        except Exception:
            # Ne jamais bloquer l'enregistrement d'une fiche si la synchro SMS échoue.
            # Les données restent disponibles dans observations_complementaires.
            return

    def perform_create(self, serializer):
        try:
            medecin = Medecin.objects.select_related("med_type", "site").get(
                profile__user=self.request.user
            )
        except Medecin.DoesNotExist:
            raise serializers.ValidationError(
                {"detail": "Médecin du travail introuvable pour cet utilisateur."}
            )
        # Snapshot du matricule : utile quand collaborateur=null (visite embauche).
        # Permet à FicheAptitudeSerializer de retrouver les données im_db sans collaborateur lié.
        # Le champ matricule existe bien sur le modèle (migration 0018).
        extra = {}
        matricule_from_request = str(self.request.data.get("matricule") or "").strip()
        if matricule_from_request:
            extra["matricule"] = matricule_from_request
        # Auto-fill entreprise/site-related fields when medecin has a site
        site_kwargs = {}
        if medecin and medecin.site_id:
            site = medecin.site
            site_kwargs = {
                "site": site,
                "raison_sociale": site.raison_sociale or "",
                "nature_activite": site.nature_activite or "",
                "adresse_entreprise": site.adresse or "",
                "numero_cnss_entreprise": (site.numero_cnss_entreprise or "").strip()
                or (site.numero_cnss or "").strip()
                or "",
            }

        instance = serializer.save(medecin_travail=medecin, **site_kwargs, **extra)
        self._sync_numero_cnss_to_collaborateur(instance)
        self._sync_sms_mateur_payload(instance, raw_payload=self.request.data.get("sms_mateur_payload"))

    def perform_update(self, serializer):
        instance = serializer.save()
        self._sync_numero_cnss_to_collaborateur(instance)
        self._sync_sms_mateur_payload(instance, raw_payload=self.request.data.get("sms_mateur_payload"))

    @action(detail=True, methods=["post"], url_path="rattacher_ligne")
    def rattacher_ligne(self, request, pk=None):
        """
        POST { "ligne_visite_periodique": <id> } — même effet qu'un PATCH partiel
        sur la fiche pour ce champ (médecin du travail).
        """
        fiche = self.get_object()
        ligne_id = request.data.get("ligne_visite_periodique")
        if ligne_id in (None, ""):
            return Response(
                {"error": "Le champ ligne_visite_periodique est requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = self.get_serializer(
            fiche,
            data={"ligne_visite_periodique": ligne_id},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="infirmier_list")
    def infirmier_list(self, request):
        """
        Fiches avec collaborateur medical_db dont le matricule existe dans
        im_db.resource (RH). Exclut embauche sans collaborateur et collaborateurs
        sans ligne ressource im_db (noms/prénoms non fiables).
        """
        queryset = filter_fiches_collaborateur_in_im_db(
            self.get_queryset(),
            get_im_site_filter_from_request(request),
        )
        data = self.get_serializer(queryset, many=True).data
        return Response(data)

    @action(detail=True, methods=["patch"], url_path="sauvegarder_remarque")
    def sauvegarder_remarque(self, request, pk=None):
        """
        Endpoint infirmier : crée ou met à jour la RemarqueInfirmier
        liée à cette fiche d'aptitude.
        Champs acceptés : remarque, reevaluation
        """
        from apps.act_infirmier.permissions import IsInfirmier
        if not IsInfirmier().has_permission(request, self):
            return Response(
                {"error": "Accès réservé aux infirmiers."},
                status=status.HTTP_403_FORBIDDEN,
            )
        fiche = self.get_object()
        # Corps attendu : remarque, reevaluation (orthographe API). Fusion :
        # seules les clés présentes dans le JSON sont mises à jour.
        payload = {}
        if "remarque" in request.data:
            v = request.data.get("remarque")
            payload["remarque"] = "" if v is None else v
        if "reevaluation" in request.data:
            v = request.data.get("reevaluation")
            payload["reevaluation"] = "" if v is None else v
        if not payload:
            return Response(
                {"error": "Fournir au moins un des champs : remarque, reevaluation."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        remarque_obj, _ = RemarqueInfirmier.objects.get_or_create(
            fiche_aptitude=fiche,
            defaults={"infirmier": request.user.profile},
        )
        serializer = RemarqueInfirmierSerializer(
            remarque_obj,
            data=payload,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        fiche = self.get_queryset().get(pk=fiche.pk)
        return Response(FicheAptitudeSerializer(fiche).data)

    @action(detail=False, methods=["get"], url_path="by_collaborateur")
    def by_collaborateur(self, request):
        collaborateur_id = request.query_params.get("collaborateur_id")
        if not collaborateur_id:
            return Response(
                {"error": "Le paramètre collaborateur_id est requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        queryset = self.get_queryset().filter(collaborateur_id=collaborateur_id)
        data = self.get_serializer(queryset, many=True).data
        return Response(data)

    @action(detail=False, methods=["get"])
    def by_matricule(self, request):
        """
        Fiches pour ce matricule collaborateur, uniquement si la ressource existe
        dans im_db (même règle que infirmier_list).
        """
        matricule = request.query_params.get("matricule")
        if not matricule:
            return Response(
                {"error": "Le paramètre matricule est requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        queryset = self.get_queryset().filter(collaborateur__matricule=matricule)
        queryset = filter_fiches_collaborateur_in_im_db(
            queryset,
            get_im_site_filter_from_request(request),
        )
        data = self.get_serializer(queryset, many=True).data
        return Response(data)

    @action(detail=True, methods=["get"], url_path="dossier_medical")
    def dossier_medical(self, request, pk=None):
        fiche = self.get_object()
        collaborateur = fiche.collaborateur
        if not collaborateur:
            return Response(
                {"error": "Cette fiche aptitude n est rattachee a aucun collaborateur."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            dossier = DossierMedical.objects.select_related("collaborateur", "site").get(
                collaborateur=collaborateur,
                site_id=fiche.site_id,
            )
        except DossierMedical.DoesNotExist:
            return Response(
                {"error": "Aucun dossier médical trouvé pour ce collaborateur."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = DossierMedicalDetailSerializer(dossier)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="feedback_rh")
    def feedback_rh(self, request):
        if not IsRH().has_permission(request, self):
            return Response({"error": "Accès réservé au rôle RH."}, status=status.HTTP_403_FORBIDDEN)

        queryset = self.get_queryset().filter(candidats_embauche__isnull=False).distinct()
        liste_id = request.query_params.get("liste_id")
        date_visite = request.query_params.get("date_visite")
        if liste_id:
            queryset = queryset.filter(candidats_embauche__liste_id=liste_id)
        if date_visite:
            queryset = queryset.filter(date_visite=date_visite)
        return Response(self.get_serializer(queryset, many=True).data)

    @action(detail=False, methods=["get"], url_path="sans_visite_periodique")
    def sans_visite_periodique(self, request):
        """
        RH uniquement : collaborateurs dont la dernière fiche d'aptitude de type
        PERIODIQUE, REPRISE ou SPONTANÉE date de plus de 12 mois, ou n'ayant
        aucune fiche liée (collaborateur renseigné sur la fiche).
        """
        seuil = timezone.localdate() - timedelta(days=365)
        types_visite = ["PERIODIQUE", "REPRISE", "SPONTANEE"]

        collabs_en_retard = (
            Collaborateur.objects.filter(
                fiches_aptitude__collaborateur__isnull=False,
                fiches_aptitude__type_visite__in=types_visite,
            )
            .distinct()
            .annotate(
                derniere_visite=Max(
                    "fiches_aptitude__date_visite",
                    filter=Q(fiches_aptitude__type_visite__in=types_visite),
                )
            )
            .filter(derniere_visite__lte=seuil)
        )

        ids_en_retard = set(collabs_en_retard.values_list("pk", flat=True))

        sans_aucune_fiche = (
            Collaborateur.objects.annotate(n=Count("fiches_aptitude"))
            .filter(n=0)
            .exclude(pk__in=ids_en_retard)
        )

        result = []

        for c in collabs_en_retard:
            jours = (timezone.localdate() - c.derniere_visite).days
            result.append(
                {
                    "id": c.id,
                    "collaborateur_id": c.id,
                    "matricule": c.matricule,
                    "nom": c.nom,
                    "prenom": c.prenom,
                    "departement": getattr(c, "department", "") or "",
                    "derniere_visite_date": c.derniere_visite.isoformat()
                    if c.derniere_visite
                    else None,
                    "mois_depuis_derniere_visite": round(jours / 30),
                    "jours_depuis_derniere_visite": jours,
                }
            )

        for c in sans_aucune_fiche:
            result.append(
                {
                    "id": c.id,
                    "collaborateur_id": c.id,
                    "matricule": c.matricule,
                    "nom": c.nom,
                    "prenom": c.prenom,
                    "departement": getattr(c, "department", "") or "",
                    "derniere_visite_date": None,
                    "mois_depuis_derniere_visite": None,
                    "jours_depuis_derniere_visite": None,
                }
            )

        result.sort(
            key=lambda x: (
                x["jours_depuis_derniere_visite"]
                if x["jours_depuis_derniere_visite"] is not None
                else 10**9
            ),
            reverse=True,
        )
        return Response(result)

    @action(detail=False, methods=["get"], url_path="alertes-visite-periodique-rh")
    def alertes_visite_periodique_rh(self, request):
        """
        RH uniquement : collaborateurs dont l'échéance (dernière ``date_visite`` du périmètre,
        tous types de fiche, + 12 mois calendaires) est en retard ou dans la fenêtre d'anticipation
        ``min(horizon_jours, 30 jours)``. Voir ``apps.medical_work.alertes_vp_rh``.

        Query params :
        - site_id : doit correspondre au site du RH (redondant mais vérifiable côté front).
        - horizon_jours : entier entre 1 et 3660 (défaut 30 ; plafonné avec 30 pour l'anticipation).

        Périmètre : site de la fiche = site du RH **ou** médecin titulaire = site du RH.

        Exclusion « liste VP » : BROUILLON / SOUMISE / EN_TRAITEMENT (même site liste).
        """
        if not IsRH().has_permission(request, self):
            return Response(
                {"error": "Accès réservé au rôle RH."},
                status=status.HTTP_403_FORBIDDEN,
            )

        rh_site = get_site_utilisateur(request.user)
        site_id_param = request.query_params.get("site_id")
        if site_id_param not in (None, ""):
            try:
                sid = int(site_id_param)
            except (TypeError, ValueError):
                return Response({"error": "site_id invalide."}, status=status.HTTP_400_BAD_REQUEST)
            if rh_site is None or sid != rh_site.id:
                return Response(
                    {"error": "site_id ne correspond pas au site du RH."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        horizon_jours = 30
        hj_raw = request.query_params.get("horizon_jours")
        if hj_raw not in (None, ""):
            try:
                horizon_jours = int(hj_raw)
            except (TypeError, ValueError):
                return Response({"error": "horizon_jours invalide."}, status=status.HTTP_400_BAD_REQUEST)
            if horizon_jours < 1 or horizon_jours > 3660:
                return Response(
                    {"error": "horizon_jours doit être compris entre 1 et 3660."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        rows, meta = compute_alertes_visite_periodique_rh(rh_site, horizon_jours=horizon_jours)
        payload = {
            "count": meta["total"],
            "en_retard": meta["en_retard"],
            "a_planifier": meta["a_planifier"],
            "horizon_jours": horizon_jours,
            "results": rows,
            "meta": meta,
        }
        if len(rows) == 0:
            payload["message_si_vide"] = (
                "Aucune alerte pour ce périmètre et ces règles métier."
            )
        return Response(payload)


class DemandeBilanViewSet(SiteScopedObjectMixin, viewsets.ModelViewSet):
    queryset = DemandeBilan.objects.select_related("fiche_aptitude", "fiche_aptitude__collaborateur")
    serializer_class = DemandeBilanSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        medecin = get_request_medecin(self.request)
        if medecin and medecin.site_id:
            queryset = queryset.filter(fiche_aptitude__medecin_travail=medecin)
        return filter_queryset_by_user_site(queryset, self.request.user)

    def get_permissions(self):
        base = [MustChangePasswordPermission, IsAuthenticated, IsSameSiteOrAssignedMedecin]
        # Données médicales confidentielles : jamais visibles par RH.
        # Tous les accès (lecture/écriture/actions) sont réservés au médecin du travail.
        specific = [IsMedecinTravail]
        return [permission() for permission in (*base, *specific)]

    @action(detail=False, methods=["get"])
    def by_fiche(self, request):
        fiche_id = request.query_params.get("fiche_id")
        if not fiche_id:
            return Response({"error": "Le paramètre fiche_id est requis."}, status=status.HTTP_400_BAD_REQUEST)
        queryset = self.get_queryset().filter(fiche_aptitude_id=fiche_id)
        data = self.get_serializer(queryset, many=True).data
        return Response(data)

    @action(detail=False, methods=["post"], url_path="depuis_embauche")
    def depuis_embauche(self, request):
        candidat_id = request.data.get("candidat_id")
        if not candidat_id:
            return Response({"error": "candidat_id est requis."}, status=status.HTTP_400_BAD_REQUEST)
        candidat = CandidatEmbauche.objects.select_related("fiche_aptitude").filter(pk=candidat_id).first()
        if not candidat:
            return Response({"error": "Candidat introuvable."}, status=status.HTTP_404_NOT_FOUND)
        if not candidat.fiche_aptitude_id:
            return Response(
                {"error": "Le candidat doit avoir une fiche d'aptitude liée."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        medecin = get_request_medecin(request)
        if medecin and candidat.fiche_aptitude.site_id != medecin.site_id:
            return Response({"error": "Candidat hors du périmètre du site."}, status=status.HTTP_403_FORBIDDEN)

        payload = request.data.copy()
        payload["fiche_aptitude"] = candidat.fiche_aptitude_id
        serializer = self.get_serializer(data=payload)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()
        return Response(self.get_serializer(obj).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="feedback_rh")
    def feedback_rh(self, request):
        queryset = self.get_queryset().filter(
            fiche_aptitude__candidats_embauche__isnull=False
        ).distinct()
        liste_id = request.query_params.get("liste_id")
        date_visite = request.query_params.get("date_visite")
        if liste_id:
            queryset = queryset.filter(fiche_aptitude__candidats_embauche__liste_id=liste_id)
        if date_visite:
            queryset = queryset.filter(fiche_aptitude__date_visite=date_visite)
        return Response(self.get_serializer(queryset, many=True).data)


class DemandeExamenViewSet(SiteScopedObjectMixin, viewsets.ModelViewSet):
    queryset = DemandeExamen.objects.select_related("fiche_aptitude", "fiche_aptitude__collaborateur")
    serializer_class = DemandeExamenSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        medecin = get_request_medecin(self.request)
        if medecin and medecin.site_id:
            queryset = queryset.filter(fiche_aptitude__medecin_travail=medecin)
        return filter_queryset_by_user_site(queryset, self.request.user)

    def get_permissions(self):
        base = [MustChangePasswordPermission, IsAuthenticated, IsSameSiteOrAssignedMedecin]
        # Données médicales confidentielles : jamais visibles par RH.
        # Tous les accès (lecture/écriture/actions) sont réservés au médecin du travail.
        specific = [IsMedecinTravail]
        return [permission() for permission in (*base, *specific)]

    @action(detail=False, methods=["get"])
    def by_fiche(self, request):
        fiche_id = request.query_params.get("fiche_id")
        if not fiche_id:
            return Response({"error": "Le paramètre fiche_id est requis."}, status=status.HTTP_400_BAD_REQUEST)
        queryset = self.get_queryset().filter(fiche_aptitude_id=fiche_id)
        data = self.get_serializer(queryset, many=True).data
        return Response(data)

    @action(detail=False, methods=["post"], url_path="depuis_embauche")
    def depuis_embauche(self, request):
        candidat_id = request.data.get("candidat_id")
        if not candidat_id:
            return Response({"error": "candidat_id est requis."}, status=status.HTTP_400_BAD_REQUEST)
        candidat = CandidatEmbauche.objects.select_related("fiche_aptitude").filter(pk=candidat_id).first()
        if not candidat:
            return Response({"error": "Candidat introuvable."}, status=status.HTTP_404_NOT_FOUND)
        if not candidat.fiche_aptitude_id:
            return Response(
                {"error": "Le candidat doit avoir une fiche d'aptitude liée."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        medecin = get_request_medecin(request)
        if medecin and candidat.fiche_aptitude.site_id != medecin.site_id:
            return Response({"error": "Candidat hors du périmètre du site."}, status=status.HTTP_403_FORBIDDEN)

        payload = request.data.copy()
        payload["fiche_aptitude"] = candidat.fiche_aptitude_id
        serializer = self.get_serializer(data=payload)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()
        return Response(self.get_serializer(obj).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="feedback_rh")
    def feedback_rh(self, request):
        queryset = self.get_queryset().filter(
            fiche_aptitude__candidats_embauche__isnull=False
        ).distinct()
        liste_id = request.query_params.get("liste_id")
        date_visite = request.query_params.get("date_visite")
        if liste_id:
            queryset = queryset.filter(fiche_aptitude__candidats_embauche__liste_id=liste_id)
        if date_visite:
            queryset = queryset.filter(fiche_aptitude__date_visite=date_visite)
        return Response(self.get_serializer(queryset, many=True).data)


class CertificatAptitudeViewSet(SiteScopedObjectMixin, viewsets.ModelViewSet):
    queryset = CertificatAptitude.objects.select_related("fiche_aptitude", "fiche_aptitude__collaborateur")
    serializer_class = CertificatAptitudeSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        medecin = get_request_medecin(self.request)
        if medecin and medecin.site_id:
            queryset = queryset.filter(fiche_aptitude__medecin_travail=medecin)
        return filter_queryset_by_user_site(queryset, self.request.user)

    def get_permissions(self):
        return [
            MustChangePasswordPermission(),
            IsAuthenticated(),
            IsMedecinTravail(),
            IsSameSiteOrAssignedMedecin(),
        ]

    def perform_create(self, serializer):
        """
        Crée le certificat puis persiste le payload structuré Mateur (si présent).
        Le frontend Mateur envoie un JSON dans "description" sous la clé "__mateur_cert_v1".
        """
        obj = serializer.save()
        self._sync_mateur_payload(obj)

    def perform_update(self, serializer):
        """
        Si le certificat est modifié (PUT/PATCH), synchroniser aussi la table Mateur.
        """
        obj = serializer.save()
        self._sync_mateur_payload(obj)

    def _sync_mateur_payload(self, obj):
        raw = getattr(obj, "description", "") or ""
        data = None
        if isinstance(raw, str):
            s = raw.strip()
            if s.startswith("{") and s.endswith("}"):
                try:
                    data = json.loads(s)
                except Exception:
                    data = None

        matur = None
        if isinstance(data, dict):
            matur = data.get("__mateur_cert_v1") or None

        if not isinstance(matur, dict):
            return

        from apps.medical_work.models import CertificatAptitudeMateur

        avis = matur.get("avis") or {}
        entete = matur.get("entete") or {}
        apc = (avis.get("a_prendre_en_consideration") or {}) if isinstance(avis, dict) else {}
        zones = matur.get("zones") or {}
        coupe = (zones.get("coupe") or {}) if isinstance(zones, dict) else {}
        prep = (zones.get("preparation") or {}) if isinstance(zones, dict) else {}
        montage = (zones.get("montage") or {}) if isinstance(zones, dict) else {}

        def pick(d, k):
            if not isinstance(d, dict):
                return ""
            v = d.get(k)
            return (str(v).strip() if v is not None else "")

        CertificatAptitudeMateur.objects.update_or_create(
            certificat=obj,
            defaults={
                "collaborateur": getattr(getattr(obj, "fiche_aptitude", None), "collaborateur", None),
                "medecin_travail": getattr(getattr(obj, "fiche_aptitude", None), "medecin_travail", None),
                "type_visite": pick(matur, "type_visite"),
                "aptitude": pick(matur, "aptitude"),
                "entete_certificat_medical_aptitude": bool(entete.get("certificat_medical_aptitude", True)) if isinstance(entete, dict) else True,
                "entete_reprise_au_poste": bool(entete.get("reprise_au_poste", False)) if isinstance(entete, dict) else False,
                "avis_etat_general_efficience": pick(avis, "etat_general_efficience"),
                "avis_debout_prolonge": pick(avis, "debout_prolonge"),
                "avis_assis_prolonge": pick(avis, "assis_prolonge"),
                "avis_charge_sup_4kg": pick(avis, "charge_sup_4kg"),
                "avis_poignet_bras_epaule": pick(avis, "poignet_bras_epaule"),
                "avis_cou": pick(avis, "cou"),
                "avis_effort_precision_concentration": pick(avis, "effort_precision_concentration"),
                "avis_rotation_equipe_possible": pick(avis, "rotation_equipe_possible"),
                "apc_maladie_professionnelle": pick(apc, "maladie_professionnelle"),
                "apc_accident_travail_sequelles": pick(apc, "accident_travail_sequelles"),
                "apc_maladies_chroniques": pick(apc, "maladies_chroniques"),
                "zone_coupe_coupe": pick(coupe, "coupe"),
                "zone_coupe_sertissage_manuel": pick(coupe, "sertissage_manuel"),
                "zone_coupe_autres_remarques": pick(coupe, "autres_remarques"),
                "zone_prep_epissure": pick(prep, "epissure"),
                "zone_prep_retreint": pick(prep, "retreint"),
                "zone_prep_torsadage": pick(prep, "torsadage"),
                "zone_prep_eiamage": pick(prep, "eiamage"),
                "zone_prep_kabatec": pick(prep, "kabatec"),
                "zone_prep_lovage": pick(prep, "lovage"),
                "zone_prep_autres_remarques": pick(prep, "autres_remarques"),
                "zone_montage_sous_element": pick(montage, "sous_element"),
                "zone_montage_lad": pick(montage, "montage_lad"),
                "zone_montage_pu": pick(montage, "pu"),
                "zone_montage_c_agrafs": pick(montage, "c_agrafs"),
                "zone_montage_vissage": pick(montage, "vissage"),
                "zone_montage_goulotte": pick(montage, "montage_goulotte"),
                "zone_montage_bol": pick(montage, "bol"),
                "zone_montage_c_final": pick(montage, "c_final"),
                "zone_montage_autre_postes": pick(montage, "autre_postes_montage"),
                "autres_remarques": pick(matur, "autres_remarques"),
            },
        )

    @action(detail=False, methods=["get"])
    def by_fiche(self, request):
        fiche_id = request.query_params.get("fiche_id")
        if not fiche_id:
            return Response({"error": "Le paramètre fiche_id est requis."}, status=status.HTTP_400_BAD_REQUEST)
        queryset = self.get_queryset().filter(fiche_aptitude_id=fiche_id)
        data = self.get_serializer(queryset, many=True).data
        return Response(data)


class OrdonnanceViewSet(SiteScopedObjectMixin, viewsets.ModelViewSet):
    queryset = Ordonnance.objects.select_related("fiche_aptitude", "fiche_aptitude__collaborateur")
    serializer_class = OrdonnanceSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        medecin = get_request_medecin(self.request)
        if medecin and medecin.site_id:
            queryset = queryset.filter(fiche_aptitude__medecin_travail=medecin)
        return filter_queryset_by_user_site(queryset, self.request.user)

    def get_permissions(self):
        base = [MustChangePasswordPermission, IsAuthenticated, IsSameSiteOrAssignedMedecin]
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            specific = [IsAnyMedecinOrRH]
        else:
            specific = [IsMedecinTravail]
        return [permission() for permission in (*base, *specific)]

    @action(detail=False, methods=["get"])
    def by_fiche(self, request):
        fiche_id = request.query_params.get("fiche_id")
        if not fiche_id:
            return Response(
                {"error": "Le paramètre fiche_id est requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        queryset = self.get_queryset().filter(fiche_aptitude_id=fiche_id)
        return Response(self.get_serializer(queryset, many=True).data)


class FicheLiaisonViewSet(SiteScopedObjectMixin, viewsets.ModelViewSet):
    queryset = FicheLiaison.objects.select_related("fiche_aptitude", "fiche_aptitude__collaborateur")
    serializer_class = FicheLiaisonSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        medecin = get_request_medecin(self.request)
        if medecin and medecin.site_id:
            queryset = queryset.filter(fiche_aptitude__medecin_travail=medecin)
        return filter_queryset_by_user_site(queryset, self.request.user)

    def get_permissions(self):
        base = [MustChangePasswordPermission, IsAuthenticated, IsSameSiteOrAssignedMedecin]
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            specific = [IsAnyMedecinOrRH]
        else:
            specific = [IsMedecinTravail]
        return [permission() for permission in (*base, *specific)]

    @action(detail=False, methods=["get"])
    def by_fiche(self, request):
        fiche_id = request.query_params.get("fiche_id")
        if not fiche_id:
            return Response(
                {"error": "Le paramètre fiche_id est requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        queryset = self.get_queryset().filter(fiche_aptitude_id=fiche_id)
        return Response(self.get_serializer(queryset, many=True).data)