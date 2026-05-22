import logging

from django.db import IntegrityError, transaction
from django.utils.dateparse import parse_date
from datetime import timedelta
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.account.models import Medecin, Profile
from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import SiteScopedQuerysetCreateMixin, get_site_utilisateur
from apps.medical_work.permissions import IsMedecinTravail
from apps.medical_work.permissions import get_request_medecin
from apps.embauche.permissions import (
    IsInfirmierRole,
    IsRH,
    IsRHOrInfirmier,
    IsRHOrInfirmierOrMedecinTravail,
)
from apps.embauche.views.liste_viewsets import IsInfirmierOrMedecinTravail
from apps.employees.models import Collaborateur
from apps.visites_periodiques.models import LigneVisitePeriodique, ListeVisitePeriodique
from apps.visites_periodiques.serializers import (
    ListeVisitePeriodiqueDetailSerializer,
    ListeVisitePeriodiqueSerializer,
)
from apps.visites_periodiques.site_scope import (
    filter_listes_vp_queryset_par_site,
    liste_vp_accessible_sur_site,
)

logger = logging.getLogger(__name__)


def _parse_date_visite_vp(value):
    """
    Accepte ``AAAA-MM-JJ`` et les dates ISO complètes souvent envoyées par le front
    (ex. ``2026-05-09T00:00:00.000Z``), que ``parse_date`` seul ne reconnaît pas.
    """
    if value in (None, ""):
        return None
    s = str(value).strip()
    if "T" in s:
        s = s.split("T", 1)[0].strip()
    return parse_date(s)


def _horizon_jours_query_param(request, default=30):
    raw = request.query_params.get("horizon_jours")
    if raw in (None, ""):
        return default
    try:
        n = int(str(raw).strip())
    except (TypeError, ValueError):
        return default
    return max(1, min(n, 365))


class ListeVisitePeriodiqueViewSet(SiteScopedQuerysetCreateMixin, viewsets.ModelViewSet):
    queryset = ListeVisitePeriodique.objects.select_related(
        "cree_par__user",
        "medecin__profile__user",
        "medecin__med_type",
    ).prefetch_related("lignes__collaborateur")

    def get_serializer_class(self):
        if self.action in ("list", "pour_medecin"):
            return ListeVisitePeriodiqueSerializer
        return ListeVisitePeriodiqueDetailSerializer

    def _apply_pour_medecin(self, qs, medecin):
        """
        ``?pour_medecin=true`` : pour un médecin du travail, ne retourner que les listes VP
        assignées à ce médecin (évite toute confusion avec d’autres écrans / agrégations front).
        """
        raw = self.request.query_params.get("pour_medecin", "").lower()
        if raw not in ("true", "1", "yes"):
            return qs
        if medecin and IsMedecinTravail().has_permission(self.request, self):
            return qs.filter(medecin=medecin)
        return qs

    def get_queryset(self):
        qs = super().get_queryset()
        medecin = get_request_medecin(self.request)

        # Route dédiée front : …/listes-visites-periodiques/pour_medecin/?site_id=…
        # (équivalent sémantique à ?pour_medecin=true sur le list, sans mélanger avec d’autres flux)
        if self.action == "pour_medecin":
            if not medecin or not IsMedecinTravail().has_permission(self.request, self):
                return qs.none()
            if medecin.site_id:
                qs = qs.filter(medecin__site=medecin.site)
            return (
                qs.exclude(statut=ListeVisitePeriodique.STATUT_ARCHIVEE)
                .filter(medecin=medecin)
            )

        if medecin and medecin.site_id:
            qs = qs.filter(medecin__site=medecin.site)

        is_rh = IsRH().has_permission(self.request, self)

        if self.action == "list":
            archived = self.request.query_params.get("archived", "").lower()
            if archived in ("true", "1", "yes"):
                if is_rh:
                    qs = qs.filter(statut=ListeVisitePeriodique.STATUT_ARCHIVEE)
                else:
                    return qs.none()
            else:
                if not is_rh:
                    qs = qs.exclude(statut=ListeVisitePeriodique.STATUT_ARCHIVEE)
            return self._apply_pour_medecin(qs, medecin)

        if self.action == "retrieve":
            if not is_rh:
                qs = qs.exclude(statut=ListeVisitePeriodique.STATUT_ARCHIVEE)
            return self._apply_pour_medecin(qs, medecin)

        if not is_rh:
            qs = qs.exclude(statut=ListeVisitePeriodique.STATUT_ARCHIVEE)
        return self._apply_pour_medecin(qs, medecin)

    def get_permissions(self):
        base = [MustChangePasswordPermission, IsAuthenticated]
        if self.action in (
            "create",
            "destroy",
            "update",
            "partial_update",
            "soumettre",
        ):
            specific = [IsRH]
        elif self.action == "soumises":
            specific = [IsInfirmierOrMedecinTravail]
        elif self.action == "pour_medecin":
            specific = [IsMedecinTravail]
        elif self.action in ("list", "retrieve"):
            specific = [IsRHOrInfirmierOrMedecinTravail]
        elif self.action in ("cloturer", "assigner_medecin"):
            specific = [IsInfirmierRole]
        elif self.action == "prendre_en_traitement":
            specific = [IsInfirmierRole]
        elif self.action == "archiver":
            specific = [IsRH]
        elif self.action == "alertes_rh":
            specific = [IsRH]
        elif self.action in ("notifier_veille", "sms_veille", "send_sms_veille"):
            specific = [IsRHOrInfirmier]
        else:
            specific = [IsRHOrInfirmierOrMedecinTravail]
        return [p() for p in (*base, *specific)]

    def create(self, request, *args, **kwargs):
        """
        Body attendu : { date_visite, collaborateur_ids: [], reference? }

        Si ``reference`` correspond déjà à un **brouillon** créé par le même utilisateur,
        la requête met à jour date et lignes (création idempotente) au lieu de renvoyer 400.
        """
        raw_date = request.data.get("date_visite")
        collaborateur_ids = request.data.get("collaborateur_ids")
        reference = (request.data.get("reference") or "").strip()

        if raw_date in (None, ""):
            return Response(
                {"error": "date_visite est requis (AAAA-MM-JJ)."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        parsed = _parse_date_visite_vp(raw_date)
        if parsed is None:
            return Response(
                {"error": "date_visite invalide (format attendu: AAAA-MM-JJ)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if isinstance(collaborateur_ids, (int, str)):
            try:
                collaborateur_ids = [int(collaborateur_ids)]
            except (TypeError, ValueError):
                collaborateur_ids = []
        elif not isinstance(collaborateur_ids, list):
            collaborateur_ids = []

        if len(collaborateur_ids) == 0:
            return Response(
                {"error": "collaborateur_ids doit être une liste non vide d'identifiants."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ids = []
        seen = set()
        for x in collaborateur_ids:
            try:
                cid = int(x)
            except (TypeError, ValueError):
                return Response(
                    {"error": f"Identifiant collaborateur invalide : {x!r}."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if cid not in seen:
                seen.add(cid)
                ids.append(cid)

        exists = set(
            Collaborateur.objects.filter(pk__in=ids).values_list("pk", flat=True)
        )
        missing = [i for i in ids if i not in exists]
        if missing:
            return Response(
                {"error": "Collaborateur(s) introuvable(s).", "ids_invalides": missing},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # OneToOne Profile : getattr(user, "profile", None) lève encore DoesNotExist si absent
        profile = Profile.objects.filter(user=request.user).first()

        if reference:
            existing = ListeVisitePeriodique.objects.filter(reference=reference).first()
            if existing:
                # Le front peut renvoyer POST /create avec la référence déjà attribuée (brouillon
                # existant, double clic, ou confusion avec la soumission). On réutilise le brouillon
                # du même créateur au lieu d'une erreur 400.
                if (
                    existing.statut != ListeVisitePeriodique.STATUT_BROUILLON
                    or not profile
                    or existing.cree_par_id != profile.id
                ):
                    return Response(
                        {"error": "Cette référence existe déjà."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                try:
                    with transaction.atomic():
                        existing.date_visite = parsed
                        existing.save(
                            update_fields=["date_visite", "date_modification"]
                        )
                        current = set(
                            existing.lignes.values_list("collaborateur_id", flat=True)
                        )
                        target = set(ids)
                        to_remove = current - target
                        to_add = target - current
                        if to_remove:
                            existing.lignes.filter(
                                collaborateur_id__in=to_remove
                            ).delete()
                        if to_add:
                            LigneVisitePeriodique.objects.bulk_create(
                                [
                                    LigneVisitePeriodique(
                                        liste=existing, collaborateur_id=cid
                                    )
                                    for cid in sorted(to_add)
                                ]
                            )
                except IntegrityError as exc:
                    logger.warning(
                        "Mise à jour liste VP (idempotent) IntegrityError: %s", exc
                    )
                    return Response(
                        {
                            "error": "Impossible de mettre à jour la liste (lignes en conflit).",
                            "detail": str(exc),
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                liste = self.get_queryset().get(pk=existing.pk)
                serializer = ListeVisitePeriodiqueDetailSerializer(liste)
                return Response(serializer.data, status=status.HTTP_200_OK)

        try:
            with transaction.atomic():
                liste = ListeVisitePeriodique(
                    date_visite=parsed,
                    statut=ListeVisitePeriodique.STATUT_BROUILLON,
                    cree_par=profile,
                )
                if reference:
                    liste.reference = reference
                liste.save()

                LigneVisitePeriodique.objects.bulk_create(
                    [
                        LigneVisitePeriodique(liste=liste, collaborateur_id=cid)
                        for cid in ids
                    ]
                )
        except IntegrityError as exc:
            logger.warning("Création liste VP IntegrityError: %s", exc)
            return Response(
                {
                    "error": "Impossible de créer la liste (référence ou lignes en conflit).",
                    "detail": str(exc),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        liste = self.get_queryset().get(pk=liste.pk)
        serializer = ListeVisitePeriodiqueDetailSerializer(liste)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        liste = self.get_object()
        if liste.statut != ListeVisitePeriodique.STATUT_BROUILLON:
            return Response(
                {"error": "Seules les listes en BROUILLON peuvent être supprimées."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["patch"], url_path="soumettre")
    def soumettre(self, request, pk=None):
        liste = self.get_object()
        if liste.statut != ListeVisitePeriodique.STATUT_BROUILLON:
            return Response(
                {"error": "La liste doit être en BROUILLON pour être soumise."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not liste.lignes.exists():
            return Response(
                {"error": "La liste ne contient aucune ligne."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        date_visite_from_body = False
        if request.data.get("date_visite") not in (None, ""):
            parsed = _parse_date_visite_vp(request.data.get("date_visite"))
            if parsed is None:
                return Response(
                    {"error": "date_visite invalide (format attendu: AAAA-MM-JJ)."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            liste.date_visite = parsed
            date_visite_from_body = True

        if not liste.date_visite:
            return Response(
                {"error": "Définissez une date de visite avant de soumettre cette liste."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        update_fields = ["statut", "date_modification"]
        if date_visite_from_body:
            update_fields.insert(0, "date_visite")

        liste.statut = ListeVisitePeriodique.STATUT_SOUMISE
        liste.save(update_fields=update_fields)
        return Response({"status": "Liste soumise"})

    @action(detail=True, methods=["patch"], url_path="assigner_medecin")
    def assigner_medecin(self, request, pk=None):
        liste = self.get_object()
        if liste.statut not in (
            ListeVisitePeriodique.STATUT_SOUMISE,
            ListeVisitePeriodique.STATUT_EN_TRAITEMENT,
        ):
            return Response(
                {
                    "error": "La liste doit être SOUMISE ou EN_TRAITEMENT pour assigner un médecin."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        medecin_id = request.data.get("medecin")
        if not medecin_id:
            return Response(
                {"error": "Le champ medecin est requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            medecin = Medecin.objects.select_related("med_type", "profile__user").get(
                pk=medecin_id
            )
        except Medecin.DoesNotExist:
            return Response(
                {"error": "Médecin introuvable."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        med_type_name = ""
        if medecin.med_type and medecin.med_type.name:
            med_type_name = medecin.med_type.name.lower()
        if "travail" not in med_type_name:
            return Response(
                {"error": "Le médecin assigné doit être un médecin du travail."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        liste.medecin = medecin
        liste.save(update_fields=["medecin", "date_modification"])
        serializer = ListeVisitePeriodiqueDetailSerializer(liste)
        return Response(serializer.data)

    @action(detail=True, methods=["patch"], url_path="prendre-en-traitement")
    def prendre_en_traitement(self, request, pk=None):
        liste = self.get_object()
        if liste.statut != ListeVisitePeriodique.STATUT_SOUMISE:
            return Response(
                {"error": "La liste doit être SOUMISE pour passer en EN_TRAITEMENT."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not liste.medecin_id:
            return Response(
                {"error": "Assignez un médecin avant de passer en EN_TRAITEMENT."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        previous_statut = liste.statut
        liste.statut = ListeVisitePeriodique.STATUT_EN_TRAITEMENT
        liste.save(update_fields=["statut", "date_modification"])

        if previous_statut == ListeVisitePeriodique.STATUT_SOUMISE:
            try:
                from apps.visites_periodiques.visite_periodique_sms import (
                    notifier_debut_file_vp,
                )

                notifier_debut_file_vp(liste)
            except Exception:
                logger.exception(
                    "SMS visite périodique : échec notifier_debut_file pour liste %s",
                    liste.reference,
                )

        serializer = ListeVisitePeriodiqueDetailSerializer(liste)
        return Response(serializer.data)

    @action(detail=True, methods=["patch"], url_path="cloturer")
    def cloturer(self, request, pk=None):
        liste = self.get_object()
        if liste.statut != ListeVisitePeriodique.STATUT_EN_TRAITEMENT:
            return Response(
                {"error": "La liste doit être en EN_TRAITEMENT pour être clôturée."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        liste.statut = ListeVisitePeriodique.STATUT_CLOTUREE
        liste.save(update_fields=["statut", "date_modification"])
        serializer = ListeVisitePeriodiqueDetailSerializer(liste)
        return Response(serializer.data)

    @action(detail=True, methods=["patch"], url_path="archiver")
    def archiver(self, request, pk=None):
        liste = self.get_object()
        if liste.statut != ListeVisitePeriodique.STATUT_CLOTUREE:
            return Response(
                {"detail": "Seules les listes clôturées peuvent être archivées."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        liste.statut = ListeVisitePeriodique.STATUT_ARCHIVEE
        liste.save(update_fields=["statut", "date_modification"])
        serializer = ListeVisitePeriodiqueDetailSerializer(liste)
        return Response(serializer.data)

    def _run_notifier_veille(self, request, pk=None):
        liste = self.get_object()
        site = get_site_utilisateur(request.user)
        if site is not None and not liste_vp_accessible_sur_site(liste.pk, site):
            return Response(
                {
                    "sent": False,
                    "detail": "Liste hors du périmètre de votre site.",
                    "sms_count": 0,
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        from apps.visites_periodiques.visite_periodique_sms import (
            notifier_veille_liste_vp_manuelle,
        )

        payload = notifier_veille_liste_vp_manuelle(liste)
        http_status = (
            status.HTTP_200_OK if payload["sent"] else status.HTTP_400_BAD_REQUEST
        )
        return Response(payload, status=http_status)

    @action(detail=True, methods=["post"], url_path="notifier_veille")
    def notifier_veille(self, request, pk=None):
        """Envoi manuel des SMS veille (bouton RH / infirmier)."""
        return self._run_notifier_veille(request, pk)

    @action(detail=True, methods=["post"], url_path="sms_veille")
    def sms_veille(self, request, pk=None):
        """Alias frontend éventuel."""
        return self._run_notifier_veille(request, pk)

    @action(detail=True, methods=["post"], url_path="send_sms_veille")
    def send_sms_veille(self, request, pk=None):
        """Alias frontend éventuel."""
        return self._run_notifier_veille(request, pk)

    def _validate_site_id_query_for_medecin(self, request):
        """``site_id`` optionnel : doit correspondre au site du médecin connecté."""
        medecin = get_request_medecin(request)
        if not medecin:
            return Response(
                {"detail": "Profil médecin introuvable."},
                status=status.HTTP_403_FORBIDDEN,
            )
        site_id_param = request.query_params.get("site_id")
        if site_id_param in (None, ""):
            return None
        try:
            sid = int(site_id_param)
        except (TypeError, ValueError):
            return Response(
                {"detail": "site_id invalide."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not medecin.site_id or sid != medecin.site_id:
            return Response(
                {"detail": "site_id ne correspond pas au site du médecin connecté."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return None

    @action(detail=False, methods=["get"], url_path="pour_medecin")
    def pour_medecin(self, request, *args, **kwargs):
        """
        GET …/listes-visites-periodiques/pour_medecin/?site_id=…

        Listes **VP uniquement** assignées au médecin du travail connecté (hors archivées).
        Alias de l’intention ``?pour_medecin=true`` pour les clients qui utilisent un segment d’URL.
        """
        err = self._validate_site_id_query_for_medecin(request)
        if err is not None:
            return err
        return self.list(request, *args, **kwargs)

    @action(detail=False, methods=["get"], url_path="soumises")
    def soumises(self, request):
        queryset = (
            self.get_queryset()
            .exclude(statut=ListeVisitePeriodique.STATUT_ARCHIVEE)
            .filter(
                statut__in=[
                    ListeVisitePeriodique.STATUT_SOUMISE,
                    ListeVisitePeriodique.STATUT_EN_TRAITEMENT,
                ]
            )
            .order_by("date_visite")
        )

        if IsMedecinTravail().has_permission(request, self):
            try:
                medecin = Medecin.objects.get(profile__user=request.user)
                queryset = queryset.filter(medecin=medecin)
            except Exception as e:
                logger.warning(
                    "[visites_periodiques] Filtre soumises médecin impossible user=%s: %s",
                    request.user.id,
                    e,
                )
                queryset = queryset.none()

        serializer = ListeVisitePeriodiqueSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="alertes-rh")
    def alertes_rh(self, request):
        """
        GET …/alertes-rh/
        Listes VP dont la **date_visite** (jour de campagne planifié sur la liste) est :
        - **jour_j=1** (ou true) : uniquement **aujourd’hui** (écran « jour J ») ;
        - sinon : dans **[today, today + horizon_jours]** (défaut horizon 30 jours).

        Hors clôturées / archivées. Périmètre **site du RH** : médecin assigné ou créateur
        (RH / infirmier / médecin) du même site.

        La date utilisée ici est celle de **ListeVisitePeriodique.date_visite** (saisie RH
        à la création / soumission), pas la **date_visite** sur la fiche d’aptitude saisie
        par le médecin lors de l’acte médical — ce sont deux notions complémentaires.

        Query : horizon_jours (1–365, défaut 30 ; ignoré si jour_j=1). site_id optionnel
        (doit égaler le site du RH).
        """
        if not IsRH().has_permission(request, self):
            return Response({"detail": "Accès réservé au rôle RH."}, status=403)

        rh_site = get_site_utilisateur(request.user)
        site_id_param = request.query_params.get("site_id")
        if site_id_param not in (None, ""):
            try:
                sid = int(site_id_param)
            except (TypeError, ValueError):
                return Response(
                    {"detail": "site_id invalide."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if rh_site is None or sid != rh_site.id:
                return Response(
                    {"detail": "site_id ne correspond pas au site du RH."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        horizon = _horizon_jours_query_param(request)
        today = timezone.localdate()
        jour_j_raw = (request.query_params.get("jour_j") or "").strip().lower()
        jour_j = jour_j_raw in ("1", "true", "yes", "oui")

        qs = filter_listes_vp_queryset_par_site(self.get_queryset(), rh_site)
        qs = qs.exclude(
            statut__in=[
                ListeVisitePeriodique.STATUT_CLOTUREE,
                ListeVisitePeriodique.STATUT_ARCHIVEE,
            ]
        )
        if jour_j:
            qs = qs.filter(date_visite=today)
        else:
            limite = today + timedelta(days=horizon)
            qs = qs.filter(date_visite__gte=today, date_visite__lte=limite)
        qs = qs.order_by("date_visite")

        serializer = ListeVisitePeriodiqueSerializer(qs, many=True)
        payload = serializer.data
        return Response(
            {
                "count": len(payload),
                "results": payload,
                "horizon_jours": horizon,
                "jour_j": jour_j,
                "date_reference_serveur": today.isoformat(),
                "description_filtre": (
                    "Listes dont date_visite = aujourd'hui (jour de campagne planifié)."
                    if jour_j
                    else (
                        f"Listes dont date_visite entre {today.isoformat()} et "
                        f"{(today + timedelta(days=horizon)).isoformat()} inclus."
                    )
                ),
            }
        )
