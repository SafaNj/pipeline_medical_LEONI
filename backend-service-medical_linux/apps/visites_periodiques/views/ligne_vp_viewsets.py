import logging

from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import filter_queryset_by_user_site, get_site_utilisateur
from apps.embauche.permissions import IsRHOrInfirmier, IsRHOrInfirmierOrMedecinTravail
from apps.visites_periodiques.models import LigneVisitePeriodique, ListeVisitePeriodique
from apps.visites_periodiques.serializers import LigneVisitePeriodiqueSerializer
from apps.visites_periodiques.site_scope import liste_vp_accessible_sur_site

logger = logging.getLogger(__name__)


class LigneVisitePeriodiqueViewSet(mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = LigneVisitePeriodique.objects.select_related(
        "liste",
        "collaborateur",
        "fiche_aptitude",
    )
    serializer_class = LigneVisitePeriodiqueSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        return filter_queryset_by_user_site(queryset, self.request.user)

    def get_permissions(self):
        base = [MustChangePasswordPermission, IsAuthenticated]
        if self.action == "presence":
            specific = [IsRHOrInfirmier]
        elif self.action == "retrieve":
            specific = [IsRHOrInfirmierOrMedecinTravail]
        else:
            specific = [IsRHOrInfirmierOrMedecinTravail]
        return [p() for p in (*base, *specific)]

    @action(detail=True, methods=["patch"], url_path="presence")
    def presence(self, request, pk=None):
        ligne = self.get_object()
        value = request.data.get("presence")
        if value not in (
            LigneVisitePeriodique.PRESENCE_PRESENT,
            LigneVisitePeriodique.PRESENCE_ABSENT,
        ):
            return Response(
                {"error": "presence doit être PRESENT ou ABSENT."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        was_unset = ligne.presence == LigneVisitePeriodique.PRESENCE_NON_RENSEIGNEE
        ligne.presence = value
        ligne.save(update_fields=["presence"])

        liste = ligne.liste
        statut_liste_avant = liste.statut
        if was_unset and liste.statut in (
            ListeVisitePeriodique.STATUT_BROUILLON,
            ListeVisitePeriodique.STATUT_SOUMISE,
        ):
            liste.statut = ListeVisitePeriodique.STATUT_EN_TRAITEMENT
            liste.save(update_fields=["statut", "date_modification"])
            if statut_liste_avant == ListeVisitePeriodique.STATUT_SOUMISE:
                try:
                    from apps.visites_periodiques.visite_periodique_sms import (
                        notifier_debut_file_vp,
                    )

                    notifier_debut_file_vp(liste)
                except Exception:
                    logger.exception(
                        "SMS visite périodique : échec notifier_debut_file"
                        " (présence) liste %s",
                        liste.reference,
                    )

        return Response(
            {
                "status": "Présence mise à jour",
                "presence": ligne.presence,
                "ligne": LigneVisitePeriodiqueSerializer(
                    ligne, context={"request": request}
                ).data,
            }
        )

    @action(detail=True, methods=["post"], url_path="notifier-jour-j")
    def notifier_jour_j(self, request, pk=None):
        """
        Renvoi manuel d'un SMS « jour J » pour une ligne (badge sms_jour_j_envoye).
        RH, infirmier ou médecin du travail — liste dans le périmètre du site.
        """
        ligne = self.get_object()
        site = get_site_utilisateur(request.user)
        if site is not None and not liste_vp_accessible_sur_site(ligne.liste_id, site):
            return Response(
                {"sent": False, "detail": "Ligne hors du périmètre de votre site."},
                status=status.HTTP_403_FORBIDDEN,
            )
        from apps.visites_periodiques.visite_periodique_sms import (
            notifier_jour_j_ligne_vp_manuelle,
        )

        payload = notifier_jour_j_ligne_vp_manuelle(ligne)
        http_status = (
            status.HTTP_200_OK if payload["sent"] else status.HTTP_400_BAD_REQUEST
        )
        return Response(payload, status=http_status)
