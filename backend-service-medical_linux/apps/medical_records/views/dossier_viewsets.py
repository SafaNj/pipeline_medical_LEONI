# medical_records/views/dossier_viewsets.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import (
    filter_queryset_by_user_site,
    get_im_site_filter_from_request,
    get_site_utilisateur,
    im_site_required_but_missing,
)
from apps.medical_work.permissions import IsSameSiteOrAssignedMedecin, get_request_medecin
from apps.act_infirmier.permissions import IsInfirmier
from apps.embauche.models import CandidatEmbauche
from apps.employees.models import ResourceIM
from apps.medical_work.models import FicheAptitude
from apps.medical_records.models import DossierMedical
from apps.medical_records.serializers import (
    DossierMedicalCreateFromMatriculeSerializer,
    DossierMedicalDetailSerializer,
    DossierMedicalListSerializer,
)
from apps.medical_work.permissions import IsMedecinTravail
from apps.medical_work.views.mixins import SiteScopedObjectMixin


class DossierMedicalViewSet(SiteScopedObjectMixin, viewsets.ModelViewSet):
    """
    CRUD API for Medical Records (Dossiers Médicaux).

    Règles d'accès :
    - Lecture (list/retrieve/actions GET) : tout utilisateur authentifié sans must_change_password
    - Création (POST) : médecin du travail uniquement
      → utilisé lors des visites d'embauche (collaborateur=null, matricule_ref=matricule candidat)
      → si un dossier avec ce matricule_ref existe déjà, retourne le dossier existant (idempotent)
    - Modification (PATCH/PUT) : médecin du travail uniquement
    - Suppression : bloquée (cycle de vie lié au collaborateur)
    """

    queryset = DossierMedical.objects.select_related("collaborateur", "site")
    serializer_class = DossierMedicalDetailSerializer

    # On n'utilise PAS DjangoModelPermissions ici :
    # il vérifie les permissions de groupe Django AVANT d'arriver au code métier,
    # ce qui causait un 403 systématique. Le contrôle est fait par action ci-dessous.
    permission_classes = [
        MustChangePasswordPermission,
        IsAuthenticated,
        IsSameSiteOrAssignedMedecin,
    ]
    search_fields = ["nom", "prenom", "collaborateur__matricule", "matricule_ref"]
    ordering_fields = ["nom", "prenom", "date_creation"]

    def _has_valid_site_id(self, medecin):
        site_id = getattr(medecin, "site_id", None)
        return isinstance(site_id, int) and site_id > 0

    def get_queryset(self):
        queryset = super().get_queryset()
        medecin = get_request_medecin(self.request)
        if medecin and self._has_valid_site_id(medecin):
            queryset = queryset.filter(site_id=medecin.site_id)
        return filter_queryset_by_user_site(queryset, self.request.user)

    def _get_im_resource_by_matricule(self, matricule, im_site_scope=None):
        """
        im_site_scope : None = pas de filtre site ; str = resource.site ;
        False = aucune ligne (utilisateur sans périmètre IM).
        """
        if im_site_scope is False:
            return None
        if not matricule or not str(matricule).strip().isdigit():
            return None
        qs = ResourceIM.objects.using("im_db").filter(matricule=int(str(matricule).strip()))
        if im_site_scope:
            qs = qs.filter(site=im_site_scope)
        return qs.first()

    def _im_payload(self, resource):
        if not resource:
            return {}
        return {
            "date_naissance": resource.date_naissance,
            "lieu_naissance": resource.lieu_naissance,
            "adresse": resource.adress,
            "gouvernorat": resource.adr_gouv,
            "ville": resource.adr_ville,
            "telephone": resource.telephone,
            "cin": resource.CIN,
            "numero_cnss": resource.CNSS,
        }

    def _latest_fiche_numero_cnss(self, collaborateur=None, matricule_ref=None):
        """
        CNSS saisi sur une fiche d'aptitude (médecin).
        Parcourt les fiches les plus récentes en premier : la dernière visite peut ne pas
        avoir le champ rempli alors qu'une fiche plus ancienne l'a.
        """
        m = (matricule_ref or "").strip()
        qs = FicheAptitude.objects.order_by("-date_visite", "-pk")
        if collaborateur:
            for f in qs.filter(collaborateur_id=collaborateur.pk):
                v = (getattr(f, "numero_cnss", None) or "").strip()
                if v:
                    return v
        if m:
            for f in qs.filter(matricule=m):
                v = (getattr(f, "numero_cnss", None) or "").strip()
                if v:
                    return v
            for f in qs.filter(collaborateur__isnull=True, matricule=m):
                v = (getattr(f, "numero_cnss", None) or "").strip()
                if v:
                    return v
        return ""

    def _candidat_embauche_cnss(self, matricule):
        if not matricule:
            return ""
        c = (
            CandidatEmbauche.objects.filter(matricule=str(matricule).strip())
            .order_by("-date_creation")
            .first()
        )
        if c and (getattr(c, "numero_cnss", None) or "").strip():
            return c.numero_cnss.strip()
        return ""

    def _im_payload_merged(self, resource, collaborateur=None, matricule_ref=None):
        """
        Fusionne im_db, Collaborateur.medical_db, FicheAptitude.numero_cnss et CandidatEmbauche.
        """
        payload = dict(self._im_payload(resource)) if resource else {}
        cnss_im = (resource.CNSS or "").strip() if resource else ""
        cnss_collab = (getattr(collaborateur, "numero_cnss", None) or "").strip() if collaborateur else ""
        cnss_fiche = self._latest_fiche_numero_cnss(collaborateur, matricule_ref)
        cnss_cand = self._candidat_embauche_cnss(matricule_ref)
        # Ordre : fiche (médecin) → collaborateur → embauche → im_db
        merged_cnss = cnss_fiche or cnss_collab or cnss_cand or cnss_im or None
        if merged_cnss:
            payload["numero_cnss"] = merged_cnss
            payload["cnss"] = merged_cnss
        elif payload.get("numero_cnss"):
            payload["cnss"] = payload.get("numero_cnss")
        return payload


    def create(self, request, *args, **kwargs):
        """
        POST /api/medical-records/dossiers/

        Création d'un dossier médical par le médecin du travail.
        Cas d'usage principal : visite d'embauche.
          - collaborateur = null (le candidat n'est pas encore un collaborateur)
          - matricule_ref = matricule du candidat (lien logique)

        Si un dossier avec ce matricule_ref existe déjà, on le retourne (idempotent).
        """
        if not (IsMedecinTravail().has_permission(request, self) or IsInfirmier().has_permission(request, self)):
            return Response(
                {
                    "detail": (
                        "Création non autorisée. "
                        "Le dossier médical est créé automatiquement à la création du collaborateur, "
                        "ou par le médecin du travail lors d'une visite d'embauche."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Idempotence : si un dossier existe déjà pour ce matricule_ref, le retourner
        matricule_ref = str(request.data.get("matricule_ref") or "").strip()
        if matricule_ref:
            existant = self.get_queryset().filter(matricule_ref=matricule_ref).first()
            if existant:
                serializer = self.get_serializer(existant)
                return Response(serializer.data, status=status.HTTP_200_OK)

        payload = request.data.copy()
        medecin = get_request_medecin(request)
        if medecin and self._has_valid_site_id(medecin):
            payload["site"] = medecin.site_id
        else:
            # Important: pour les rôles non-médecins (ex. infirmier) on doit aussi
            # renseigner le site, sinon le filtrage par site cachera le dossier.
            site = get_site_utilisateur(request.user)
            if site is not None:
                payload["site"] = site.id

        serializer = self.get_serializer(data=payload)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        # Réponse complète (detail serializer) pour que le frontend ait un payload stable
        out = DossierMedicalDetailSerializer(instance, context={"request": request}).data
        return Response(out, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """PUT/PATCH autorisé au médecin du travail et à l'infirmier."""
        if not (IsMedecinTravail().has_permission(request, self) or IsInfirmier().has_permission(request, self)):
            return Response(
                {"detail": "Modification non autorisée."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Suppression bloquée — le dossier suit le cycle de vie du collaborateur."""
        return Response(
            {
                "detail": (
                    "Suppression non autorisée. "
                    "Le dossier médical est supprimé automatiquement avec le collaborateur."
                )
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def get_serializer_class(self):
        if self.action == "create":
            return DossierMedicalCreateFromMatriculeSerializer
        if self.action == "list":
            return DossierMedicalListSerializer
        return DossierMedicalDetailSerializer

    # ── ACTIONS ──────────────────────────────────────────────────────────────

    def _find_dossier_for_collaborateur(self, request, collaborateur_id, matricule=None):
        """
        Résout un dossier pour un collaborateur en tenant compte du filtre site,
        puis en secours : même matricule (query), dossier sans site_id (données anciennes).
        """
        qs_scoped = self.get_queryset()
        try:
            cid = int(str(collaborateur_id).strip())
        except (TypeError, ValueError):
            return None

        dossier = qs_scoped.filter(collaborateur_id=cid).first()
        if dossier:
            return dossier

        m = (matricule or "").strip()
        if m:
            dossier = (
                qs_scoped.filter(collaborateur__matricule=m).first()
                or qs_scoped.filter(matricule_ref=m).first()
            )
            if dossier:
                return dossier

        # Dossier présent en base mais non visible via le filtre site (ex. site_id NULL après migration)
        legacy_qs = (
            DossierMedical.objects.select_related("collaborateur", "site").filter(
                collaborateur_id=cid,
                site_id__isnull=True,
            )
        )
        return legacy_qs.first()

    @action(detail=False, methods=["get"], url_path="by_collaborateur")
    def by_collaborateur(self, request):
        """
        GET /api/medical-records/dossiers/by_collaborateur/?collaborateur_id=<id>&matricule=...

        Ne renvoie plus 404 si le dossier est absent : payload minimal (allergies vides) pour l'UI infirmier.
        """
        collaborateur_id = request.query_params.get("collaborateur_id")
        matricule = str(request.query_params.get("matricule") or "").strip()
        if not collaborateur_id:
            return Response(
                {"error": "Le paramètre collaborateur_id est requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        dossier = self._find_dossier_for_collaborateur(
            request, collaborateur_id, matricule or None
        )
        if dossier:
            return Response(
                DossierMedicalDetailSerializer(
                    dossier, context={"request": request}
                ).data
            )

        try:
            cid = int(str(collaborateur_id).strip())
        except (TypeError, ValueError):
            return Response(
                {"error": "collaborateur_id invalide."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "id": None,
                "collaborateur": cid,
                "allergies": None,
                "type_allergie": None,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"], url_path="by_matricule")
    def by_matricule(self, request):
        matricule = str(request.query_params.get("matricule") or "").strip()
        if not matricule:
            return Response(
                {"error": "Le paramètre matricule est requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if im_site_required_but_missing(request):
            return Response(
                {"error": "Votre compte n'est associé à aucun site valide pour la consultation RH."},
                status=status.HTTP_403_FORBIDDEN,
            )
        im_site = get_im_site_filter_from_request(request)

        dossier = (
            self.get_queryset().filter(collaborateur__matricule=matricule).first()
            or self.get_queryset().filter(matricule_ref=matricule).first()
        )
        if dossier:
            data = DossierMedicalDetailSerializer(dossier).data
            im_resource = self._get_im_resource_by_matricule(
                dossier.collaborateur.matricule if dossier.collaborateur_id else dossier.matricule_ref,
                im_site,
            )
            data["source"] = "dossier"
            collab = dossier.collaborateur if dossier.collaborateur_id else None
            # Toujours fournir le matricule pour retrouver les fiches embauche (champ matricule)
            # et les candidats, même si un collaborateur est déjà lié.
            matricule_pour_sources = (
                (dossier.matricule_ref or "").strip()
                or (str(collab.matricule) if collab else "")
                or matricule
            )
            merged = self._im_payload_merged(im_resource, collab, matricule_pour_sources)
            # Attention : en Python, {} est falsy — ne pas écrire `if merged` sinon im_data devient null.
            data["im_data"] = merged if len(merged) > 0 else None
            # Valeurs enrichies depuis im_db si absentes dans le dossier
            if data.get("date_naissance") in (None, "", "null") and im_resource:
                data["date_naissance"] = im_resource.date_naissance
            if not data.get("lieu_naissance") and im_resource:
                data["lieu_naissance"] = im_resource.lieu_naissance
            if not data.get("adresse") and im_resource:
                data["adresse"] = im_resource.adress
            if im_resource:
                data["gouvernorat"] = im_resource.adr_gouv
            return Response(data)

        if not matricule.isdigit():
            return Response(
                {"error": "Aucun dossier trouvé et matricule invalide pour recherche im_db."},
                status=status.HTTP_404_NOT_FOUND,
            )

        resource = self._get_im_resource_by_matricule(matricule, im_site)
        if not resource:
            medecin = get_request_medecin(request)
            candidat_queryset = CandidatEmbauche.objects.filter(matricule=matricule)
            if medecin and medecin.site_id:
                candidat_queryset = candidat_queryset.filter(liste__medecin__site_id=medecin.site_id)
            candidat = candidat_queryset.order_by("-date_creation").first()
            if candidat:
                return Response(
                    {
                        "source": "embauche",
                        "im_data": None,
                        "matricule_ref": matricule,
                        "nom": candidat.nom,
                        "prenom": candidat.prenom,
                        "date_naissance": str(candidat.date_naissance) if candidat.date_naissance else None,
                        "lieu_naissance": None,
                        "adresse": candidat.gouvernorat or None,
                        "gouvernorat": candidat.gouvernorat,
                        "ville": None,
                        "telephone": candidat.telephone,
                        "cin": candidat.cin,
                        "numero_cnss": candidat.numero_cnss or None,
                        "cnss": candidat.numero_cnss or None,
                        "fonction": candidat.poste,
                        "department": candidat.department,
                    }
                )
            return Response(
                {"error": "Aucun dossier, aucune donnée im_db et aucun candidat embauche trouvés pour ce matricule."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {
                "source": "im_db",
                "matricule_ref": matricule,
                "nom": resource.name,
                "prenom": resource.firstname,
                "date_naissance": resource.date_naissance,
                "lieu_naissance": resource.lieu_naissance,
                "adresse": resource.adress,
                "telephone": resource.telephone,
                "cin": resource.CIN,
                "numero_cnss": resource.CNSS,
                "fonction": resource.fonction,
                "gouvernorat": resource.adr_gouv,
                "ville": resource.adr_ville,
            }
        )

    @action(detail=False, methods=["get"])
    def by_groupe_sanguin(self, request):
        groupe = request.query_params.get("groupe")
        if not groupe:
            return Response(
                {"error": "groupe parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        dossiers = self.get_queryset().filter(groupe_sanguin=groupe)
        return Response(self.get_serializer(dossiers, many=True).data)

    @action(detail=False, methods=["get"])
    def has_allergies(self, request):
        dossiers = self.get_queryset().exclude(allergies__isnull=True).exclude(allergies__exact="")
        return Response(self.get_serializer(dossiers, many=True).data)

    @action(detail=False, methods=["get"])
    def has_antecedents(self, request):
        dossiers = self.get_queryset().exclude(
            antecedents_medicaux__isnull=True
        ).exclude(antecedents_medicaux__exact="")
        return Response(self.get_serializer(dossiers, many=True).data)

    @action(detail=True, methods=["patch"])
    def update_allergies(self, request, pk=None):
        dossier = self.get_object()
        allergies = request.data.get("allergies")
        if allergies is not None:
            dossier.allergies = allergies
            dossier.save()
            return Response(self.get_serializer(dossier).data)
        return Response(
            {"error": "allergies field is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )