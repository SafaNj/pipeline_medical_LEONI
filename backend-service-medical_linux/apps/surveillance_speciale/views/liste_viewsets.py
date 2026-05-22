import logging

from django.db import transaction
from django.db.models import Prefetch
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.account.models import Medecin
from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import SiteScopedQuerysetCreateMixin, filter_queryset_by_user_site, get_site_utilisateur
from apps.act_infirmier.permissions import IsInfirmier
from apps.embauche.permissions import IsRH
from apps.medical_work.permissions import IsMedecinTravail, get_request_medecin
from apps.surveillance_speciale.models import LigneSurveillanceSpeciale, ListeSurveillanceSpeciale
from apps.surveillance_speciale.models.liste_models import renumeroter_lignes_liste_apres_suppression
from apps.surveillance_speciale.serializers import (
    LigneSurveillanceSpecialeCreateSerializer,
    LigneSurveillanceSpecialeSerializer,
    ListeSurveillanceSpecialeSerializer,
)
from apps.surveillance_speciale.surveillance_speciale_sms import notifier_veille_liste_ss_manuelle

logger = logging.getLogger(__name__)


def _is_medecin_travail(medecin: Medecin) -> bool:
    med_type_name = ""
    if medecin and medecin.med_type and medecin.med_type.name:
        med_type_name = medecin.med_type.name.lower()
    return "travail" in med_type_name


class ListeSurveillanceSpecialeViewSet(SiteScopedQuerysetCreateMixin, viewsets.ModelViewSet):
    queryset = ListeSurveillanceSpeciale.objects.select_related(
        "medecin",
        "medecin__profile__user",
        "cree_par",
        "cree_par__user",
        "site",
    ).prefetch_related(
        Prefetch(
            "lignes",
            queryset=LigneSurveillanceSpeciale.objects.select_related("collaborateur").order_by(
                "ordre", "pk"
            ),
        ),
    )
    serializer_class = ListeSurveillanceSpecialeSerializer

    def get_permissions(self):
        base = [MustChangePasswordPermission, IsAuthenticated]
        if self.action == "pour_medecin":
            specific = [IsMedecinTravail]
        elif self.action in ("list", "retrieve", "existe"):
            specific = [IsRH | IsInfirmier | IsMedecinTravail]
        elif self.action in ("create", "update", "partial_update", "destroy", "soumettre"):
            specific = [IsRH]
        elif self.action == "archiver":
            specific = [IsRH]
        elif self.action in ("assigner_medecin", "cloturer", "medecins_travail"):
            specific = [IsInfirmier]
        elif self.action in ("notifier_veille", "sms_veille", "send_sms_veille"):
            specific = [IsRH | IsInfirmier]
        else:
            specific = [IsRH | IsInfirmier | IsMedecinTravail]
        return [p() for p in (*base, *specific)]

    def _lecture_seule_si_archivee(self, liste: ListeSurveillanceSpeciale):
        if liste.statut == ListeSurveillanceSpeciale.STATUT_ARCHIVEE:
            return Response(
                {"detail": "Une liste archivée est en lecture seule."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return None

    def update(self, request, *args, **kwargs):
        liste = self.get_object()
        err = self._lecture_seule_si_archivee(liste)
        if err is not None:
            return err
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        liste = self.get_object()
        err = self._lecture_seule_si_archivee(liste)
        if err is not None:
            return err
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        liste = self.get_object()
        err = self._lecture_seule_si_archivee(liste)
        if err is not None:
            return err
        return super().destroy(request, *args, **kwargs)

    def get_queryset(self):
        """
        Aligné sur embauche : `?archived=true|1|yes` → listes ARCHIVEE ;
        sinon exclusion des archivées. Périmètre site via filter_queryset_by_user_site.
        """
        qs = super().get_queryset()
        medecin = get_request_medecin(self.request)

        # GET …/listes-surveillance-speciale/pour_medecin/?site_id=… (même intention que VP)
        if self.action == "pour_medecin":
            if not medecin or not IsMedecinTravail().has_permission(self.request, self):
                return qs.none()
            if medecin.site_id:
                qs = qs.filter(medecin__site=medecin.site)
            qs = filter_queryset_by_user_site(qs, self.request.user)
            return qs.filter(
                medecin=medecin,
                statut=ListeSurveillanceSpeciale.STATUT_EN_TRAITEMENT,
            )

        if medecin and medecin.site_id:
            qs = qs.filter(medecin=medecin)

        profile = getattr(self.request.user, "profile", None)
        if not profile:
            return qs.none()
        role = (profile.role or "").strip().lower()

        if self.action == "list":
            archived = self.request.query_params.get("archived", "").lower()
            if archived in ("true", "1", "yes"):
                qs = qs.filter(statut=ListeSurveillanceSpeciale.STATUT_ARCHIVEE)
            else:
                qs = qs.exclude(statut=ListeSurveillanceSpeciale.STATUT_ARCHIVEE)
            qs = filter_queryset_by_user_site(qs, self.request.user)
            if role == "rh":
                return qs
            if role in ("infirmier", "infirmiere"):
                if archived in ("true", "1", "yes"):
                    return qs
                return qs.filter(
                    statut__in=[
                        ListeSurveillanceSpeciale.STATUT_SOUMISE,
                        ListeSurveillanceSpeciale.STATUT_EN_TRAITEMENT,
                        ListeSurveillanceSpeciale.STATUT_CLOTUREE,
                    ]
                )
            if role == "medecin" and medecin and _is_medecin_travail(medecin):
                if archived in ("true", "1", "yes"):
                    return qs
                return qs.filter(statut=ListeSurveillanceSpeciale.STATUT_EN_TRAITEMENT)
            return qs.none()

        if self.action in ("retrieve", "existe"):
            qs = filter_queryset_by_user_site(qs, self.request.user)
            if role == "medecin" and medecin and _is_medecin_travail(medecin):
                return qs.filter(statut=ListeSurveillanceSpeciale.STATUT_EN_TRAITEMENT)
            return qs

        qs = qs.exclude(statut=ListeSurveillanceSpeciale.STATUT_ARCHIVEE)
        qs = filter_queryset_by_user_site(qs, self.request.user)
        if role == "rh":
            return qs
        if role in ("infirmier", "infirmiere"):
            return qs.filter(
                statut__in=[
                    ListeSurveillanceSpeciale.STATUT_SOUMISE,
                    ListeSurveillanceSpeciale.STATUT_EN_TRAITEMENT,
                    ListeSurveillanceSpeciale.STATUT_CLOTUREE,
                ]
            )
        if role == "medecin" and medecin and _is_medecin_travail(medecin):
            return qs.filter(statut=ListeSurveillanceSpeciale.STATUT_EN_TRAITEMENT)
        return qs.none()

    def perform_create(self, serializer):
        profile = getattr(self.request.user, "profile", None)
        site = get_site_utilisateur(self.request.user)
        save_kwargs = {"cree_par": profile}
        if site is not None:
            save_kwargs["site"] = site
        serializer.save(**save_kwargs)

    @action(detail=True, methods=["patch"])
    def soumettre(self, request, pk=None):
        liste = self.get_object()
        err = self._lecture_seule_si_archivee(liste)
        if err is not None:
            return err
        if liste.statut != ListeSurveillanceSpeciale.STATUT_BROUILLON:
            return Response(
                {"detail": "La liste doit être en brouillon pour être soumise."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not liste.lignes.exists():
            return Response(
                {"detail": "La liste doit contenir au moins une ligne."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not liste.date_visite:
            return Response(
                {"detail": "La date de visite est obligatoire."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        liste.statut = ListeSurveillanceSpeciale.STATUT_SOUMISE
        liste.save(update_fields=["statut", "date_modification"])
        return Response(self.get_serializer(liste).data)

    @action(detail=True, methods=["patch"])
    def assigner_medecin(self, request, pk=None):
        liste = self.get_object()
        err = self._lecture_seule_si_archivee(liste)
        if err is not None:
            return err
        if liste.statut not in {
            ListeSurveillanceSpeciale.STATUT_SOUMISE,
            ListeSurveillanceSpeciale.STATUT_EN_TRAITEMENT,
        }:
            return Response(
                {"detail": "La liste doit être soumise ou en traitement."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        medecin_id = request.data.get("medecin") or request.data.get("medecin_id")
        if not medecin_id:
            return Response(
                {"detail": "Le champ medecin est requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            medecin = Medecin.objects.select_related("med_type", "site", "profile", "profile__user").get(
                pk=medecin_id
            )
        except Medecin.DoesNotExist:
            return Response({"detail": "Médecin introuvable."}, status=status.HTTP_400_BAD_REQUEST)
        if not _is_medecin_travail(medecin):
            return Response(
                {"detail": "Le médecin assigné doit être un médecin du travail."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not medecin.site_id:
            return Response(
                {"detail": "Le médecin doit avoir un site assigné."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if liste.site_id and medecin.site_id != liste.site_id:
            return Response(
                {"detail": "Le médecin doit appartenir au même site que la liste."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        previous_statut = liste.statut
        liste.medecin = medecin
        liste.statut = ListeSurveillanceSpeciale.STATUT_EN_TRAITEMENT
        liste.save(update_fields=["medecin", "statut", "date_modification"])
        if previous_statut == ListeSurveillanceSpeciale.STATUT_SOUMISE:
            try:
                from apps.surveillance_speciale.surveillance_speciale_sms import (
                    notifier_debut_file_surveillance_speciale,
                )

                notifier_debut_file_surveillance_speciale(liste)
            except Exception:
                logger.exception(
                    "SMS surveillance spéciale : échec notifier_debut_file liste %s",
                    liste.reference,
                )
        return Response(self.get_serializer(liste).data)

    @action(detail=True, methods=["patch"])
    def cloturer(self, request, pk=None):
        liste = self.get_object()
        err = self._lecture_seule_si_archivee(liste)
        if err is not None:
            return err
        if liste.statut != ListeSurveillanceSpeciale.STATUT_EN_TRAITEMENT:
            return Response(
                {"detail": "La liste doit être en traitement."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        lignes = list(liste.lignes.select_related("collaborateur"))
        # Liste de rattrapage : uniquement les lignes sans acte médecin terminé
        # (aligné sur l’intention embauche « fiche / traitement non terminé »).
        lignes_a_reporter = [ligne for ligne in lignes if not ligne.traitement_termine]

        nouvelle_liste = None
        with transaction.atomic():
            if lignes_a_reporter:
                nouvelle_liste = ListeSurveillanceSpeciale.objects.create(
                    cree_par=liste.cree_par,
                    site=liste.site,
                    date_visite=None,
                    medecin=None,
                    statut=ListeSurveillanceSpeciale.STATUT_BROUILLON,
                    titre=f"Report — {liste.reference}",
                )
                for idx, ligne in enumerate(lignes_a_reporter, start=1):
                    LigneSurveillanceSpeciale.objects.create(
                        liste=nouvelle_liste,
                        collaborateur=ligne.collaborateur,
                        presence=LigneSurveillanceSpeciale.PRESENCE_EN_ATTENTE,
                        ordre=idx,
                    )
            liste.statut = ListeSurveillanceSpeciale.STATUT_CLOTUREE
            liste.save(update_fields=["statut", "date_modification"])

        # Réponse alignée sur l’embauche (champs attendus par le front).
        return Response(
            {
                "status": "Liste cloturee",
                "statut": liste.statut,
                "nombre_reportes": len(lignes_a_reporter),
                "nouvelle_liste_reportee_id": nouvelle_liste.id if nouvelle_liste else None,
                "nouvelle_liste_reportee_reference": (
                    nouvelle_liste.reference if nouvelle_liste else None
                ),
                "nouvelle_liste_id": nouvelle_liste.id if nouvelle_liste else None,
                "rh_notifies_count": 0,
            }
        )

    @action(detail=True, methods=["patch"], url_path="archiver")
    def archiver(self, request, pk=None):
        """
        RH uniquement. Passe une liste CLOTUREE en ARCHIVEE.
        PATCH /api/surveillance-speciale/listes-surveillance-speciale/{id}/archiver/
        """
        liste = self.get_object()
        if liste.statut != ListeSurveillanceSpeciale.STATUT_CLOTUREE:
            return Response(
                {
                    "detail": (
                        "Seules les listes en statut CLOTUREE peuvent etre archivees."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        liste.statut = ListeSurveillanceSpeciale.STATUT_ARCHIVEE
        liste.save(update_fields=["statut", "date_modification"])
        return Response(self.get_serializer(liste).data)

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
        GET …/listes-surveillance-speciale/pour_medecin/?site_id=…

        Listes surveillance SMS assignées au médecin du travail (hors archivées), périmètre site.
        """
        err = self._validate_site_id_query_for_medecin(request)
        if err is not None:
            return err
        return self.list(request, *args, **kwargs)

    @action(detail=False, methods=["get"], url_path="existe")
    def existe(self, request, *args, **kwargs):
        """
        Indique si un identifiant correspond à une liste surveillance SMS **visible** pour l’utilisateur.

        GET …/listes-surveillance-speciale/existe/?id=37
        Réponse **toujours 200** (évite les 404 / erreurs console lorsque le front teste un id
        issu d’un flux mélangé, ex. liste VP).

        Corps typique : ``{"id": 37, "existe": false}`` ou
        ``{"id": 12, "existe": true, "type_liste": "SURVEILLANCE_SPECIALE", "flux": "SMS"}``.
        """
        raw = request.query_params.get("id") or request.query_params.get("pk")
        if raw in (None, ""):
            return Response(
                {"detail": "Paramètre id ou pk requis (ex. ?id=37)."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            pk = int(str(raw).strip())
        except (TypeError, ValueError):
            return Response(
                {
                    "id": raw,
                    "existe": False,
                    "type_liste": None,
                    "flux": None,
                },
                status=status.HTTP_200_OK,
            )

        exists = self.filter_queryset(self.get_queryset()).filter(pk=pk).exists()
        if exists:
            return Response(
                {
                    "id": pk,
                    "existe": True,
                    "type_liste": "SURVEILLANCE_SPECIALE",
                    "flux": "SMS",
                },
                status=status.HTTP_200_OK,
            )
        return Response(
            {
                "id": pk,
                "existe": False,
                "type_liste": None,
                "flux": None,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"])
    def medecins_travail(self, request):
        site = get_site_utilisateur(request.user)
        if site is None:
            return Response([])
        medecins = Medecin.objects.select_related("profile", "profile__user", "med_type", "site").filter(
            site=site
        )
        payload = []
        for m in medecins:
            if not _is_medecin_travail(m):
                continue
            user = getattr(getattr(m, "profile", None), "user", None)
            nom = (
                (m.nom_ar or "").strip()
                or (user.last_name if user else "")
                or (user.username if user else "")
                or f"Médecin #{m.id}"
            ).strip()
            prenom = ((m.prenom_ar or "").strip() or (user.first_name if user else "") or "").strip()
            payload.append({"id": m.id, "nom": nom or None, "prenom": prenom or None})
        return Response(payload)

    def _run_notifier_veille(self, request, pk=None):
        liste = self.get_object()
        site = get_site_utilisateur(request.user)
        if site is not None:
            if not filter_queryset_by_user_site(
                ListeSurveillanceSpeciale.objects.filter(pk=liste.pk), request.user
            ).exists():
                return Response(
                    {
                        "sent": False,
                        "detail": "Liste hors du périmètre de votre site.",
                        "sms_count": 0,
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
        payload = notifier_veille_liste_ss_manuelle(liste)
        http_status = status.HTTP_200_OK if payload["sent"] else status.HTTP_400_BAD_REQUEST
        return Response(payload, status=http_status)

    @action(detail=True, methods=["post"], url_path="notifier_veille")
    def notifier_veille(self, request, pk=None):
        return self._run_notifier_veille(request, pk)

    @action(detail=True, methods=["post"], url_path="sms_veille")
    def sms_veille(self, request, pk=None):
        return self._run_notifier_veille(request, pk)

    @action(detail=True, methods=["post"], url_path="send_sms_veille")
    def send_sms_veille(self, request, pk=None):
        return self._run_notifier_veille(request, pk)


class LigneSurveillanceSpecialeViewSet(SiteScopedQuerysetCreateMixin, viewsets.ModelViewSet):
    queryset = LigneSurveillanceSpeciale.objects.select_related(
        "liste",
        "liste__site",
        "collaborateur",
    ).prefetch_related(
        "fiches_aptitude",
    ).order_by("liste_id", "ordre", "pk")
    serializer_class = LigneSurveillanceSpecialeSerializer

    def get_serializer_class(self):
        if self.action == "create":
            return LigneSurveillanceSpecialeCreateSerializer
        return LigneSurveillanceSpecialeSerializer

    def get_permissions(self):
        base = [MustChangePasswordPermission, IsAuthenticated]
        if self.action in ("list", "retrieve"):
            specific = [IsRH | IsInfirmier | IsMedecinTravail]
        elif self.action == "create":
            specific = [IsRH | IsInfirmier]
        elif self.action in ("update", "partial_update"):
            specific = [IsRH]
        elif self.action == "destroy":
            specific = [IsRH]
        elif self.action == "presence":
            specific = [IsInfirmier]
        elif self.action == "terminer_traitement":
            specific = [IsMedecinTravail]
        elif self.action == "notifier_jour_j":
            specific = [IsRH | IsInfirmier | IsMedecinTravail]
        else:
            specific = [IsRH | IsInfirmier | IsMedecinTravail]
        return [p() for p in (*base, *specific)]

    def _ligne_liste_archivee_response(self, ligne: LigneSurveillanceSpeciale):
        if ligne.liste.statut == ListeSurveillanceSpeciale.STATUT_ARCHIVEE:
            return Response(
                {"detail": "Une liste archivée est en lecture seule."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return None

    def update(self, request, *args, **kwargs):
        ligne = self.get_object()
        err = self._ligne_liste_archivee_response(ligne)
        if err is not None:
            return err
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        ligne = self.get_object()
        err = self._ligne_liste_archivee_response(ligne)
        if err is not None:
            return err
        return super().partial_update(request, *args, **kwargs)

    def get_queryset(self):
        queryset = super().get_queryset()
        liste_id = self.request.query_params.get("liste")
        if liste_id:
            try:
                queryset = queryset.filter(liste_id=int(liste_id))
            except (TypeError, ValueError):
                return queryset.none()
        return queryset

    def create(self, request, *args, **kwargs):
        liste_id = request.data.get("liste") or request.data.get("liste_id")
        if not liste_id:
            return Response({"detail": "liste est requis."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            liste = ListeSurveillanceSpeciale.objects.get(pk=liste_id)
        except ListeSurveillanceSpeciale.DoesNotExist:
            return Response({"detail": "Liste introuvable."}, status=status.HTTP_404_NOT_FOUND)
        if liste.statut == ListeSurveillanceSpeciale.STATUT_ARCHIVEE:
            return Response(
                {"detail": "Impossible d'ajouter une ligne à une liste archivée."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if liste.statut == ListeSurveillanceSpeciale.STATUT_CLOTUREE:
            return Response(
                {"detail": "Impossible d'ajouter une ligne à une liste clôturée."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        profile = getattr(request.user, "profile", None)
        role = (getattr(profile, "role", "") or "").strip().lower()
        is_rh = role == "rh"
        is_infirmier = role in ("infirmier", "infirmiere")
        if is_infirmier:
            if liste.statut not in {
                ListeSurveillanceSpeciale.STATUT_SOUMISE,
                ListeSurveillanceSpeciale.STATUT_EN_TRAITEMENT,
            }:
                return Response(
                    {"detail": "La liste doit être soumise ou en traitement pour ajouter une ligne."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            site = get_site_utilisateur(request.user)
            if not site or liste.site_id != site.id:
                return Response(
                    {"detail": "Accès refusé : cette liste appartient à un autre site."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        elif is_rh:
            if liste.statut != ListeSurveillanceSpeciale.STATUT_BROUILLON:
                return Response(
                    {"detail": "La liste doit être en brouillon pour ajouter une ligne."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
        # Injecter la liste dans le payload : le serializer exige une FK valide à is_valid(),
        # alors que le front peut n'envoyer que matricule + liste_id dans l'URL ou un seul des deux.
        if hasattr(request.data, "copy"):
            payload = request.data.copy()
        else:
            payload = dict(request.data)
        payload["liste"] = liste.pk
        serializer = self.get_serializer(data=payload)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(
            LigneSurveillanceSpecialeSerializer(instance, context=serializer.context).data,
            status=status.HTTP_201_CREATED,
        )

    def destroy(self, request, *args, **kwargs):
        ligne = self.get_object()
        err = self._ligne_liste_archivee_response(ligne)
        if err is not None:
            return err
        if ligne.liste.statut != ListeSurveillanceSpeciale.STATUT_BROUILLON:
            return Response(
                {"detail": "Impossible de supprimer une ligne d'une liste déjà soumise."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)

    def perform_destroy(self, instance):
        liste_id = instance.liste_id
        super().perform_destroy(instance)
        renumeroter_lignes_liste_apres_suppression(liste_id)

    @action(detail=True, methods=["patch"])
    def presence(self, request, pk=None):
        ligne = self.get_object()
        err = self._ligne_liste_archivee_response(ligne)
        if err is not None:
            return err
        if ligne.liste.statut != ListeSurveillanceSpeciale.STATUT_EN_TRAITEMENT:
            return Response(
                {"detail": "La liste doit être en traitement."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        presence = (request.data.get("presence") or "").strip().upper()
        allowed = {
            LigneSurveillanceSpeciale.PRESENCE_PRESENT,
            LigneSurveillanceSpeciale.PRESENCE_ABSENT,
            LigneSurveillanceSpeciale.PRESENCE_REPORTE,
        }
        if presence not in allowed:
            return Response(
                {"detail": "presence doit être PRESENT, ABSENT ou REPORTE."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        raison_report = (request.data.get("raison_report") or "").strip()
        ligne.presence = presence
        ligne.raison_report = (
            raison_report if presence == LigneSurveillanceSpeciale.PRESENCE_REPORTE else ""
        )
        ligne.save(update_fields=["presence", "raison_report"])
        return Response({"presence": ligne.presence, "raison_report": ligne.raison_report})

    @action(detail=True, methods=["patch"], url_path="terminer-traitement")
    def terminer_traitement(self, request, pk=None):
        ligne = self.get_object()
        err = self._ligne_liste_archivee_response(ligne)
        if err is not None:
            return err
        if ligne.liste.statut != ListeSurveillanceSpeciale.STATUT_EN_TRAITEMENT:
            return Response(
                {"detail": "La liste doit être en traitement."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        medecin = get_request_medecin(request)
        if medecin is None or ligne.liste.medecin_id != medecin.id:
            return Response(
                {"detail": "Seul le médecin assigné peut terminer le traitement."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if ligne.presence != LigneSurveillanceSpeciale.PRESENCE_PRESENT:
            return Response(
                {"detail": "Renseignez la présence à PRESENT avant de terminer le traitement."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        remarque = (request.data.get("remarque_medecin") or "").strip()
        ligne.remarque_medecin = remarque
        ligne.traitement_termine = True
        ligne.save(update_fields=["traitement_termine", "remarque_medecin"])
        try:
            from apps.surveillance_speciale.surveillance_speciale_sms import (
                notifier_n_plus_2_apres_traitement,
            )

            notifier_n_plus_2_apres_traitement(ligne)
        except Exception:
            logger.exception("SMS SS : échec N+2 après traitement ligne %s", ligne.pk)
        return Response(self.get_serializer(ligne).data)

    @action(detail=True, methods=["post"], url_path="notifier-jour-j")
    def notifier_jour_j(self, request, pk=None):
        ligne = self.get_object()
        err = self._ligne_liste_archivee_response(ligne)
        if err is not None:
            return err
        site = get_site_utilisateur(request.user)
        if site is not None and not filter_queryset_by_user_site(
            LigneSurveillanceSpeciale.objects.filter(pk=ligne.pk), request.user
        ).exists():
            return Response(
                {"sent": False, "detail": "Ligne hors du périmètre de votre site."},
                status=status.HTTP_403_FORBIDDEN,
            )
        from apps.surveillance_speciale.surveillance_speciale_sms import notifier_jour_j_ligne_ss_manuel

        payload = notifier_jour_j_ligne_ss_manuel(ligne)
        http_status = status.HTTP_200_OK if payload["sent"] else status.HTTP_400_BAD_REQUEST
        return Response(payload, status=http_status)
