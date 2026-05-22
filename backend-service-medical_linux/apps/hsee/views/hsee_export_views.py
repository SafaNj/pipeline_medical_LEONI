import logging
import re
from datetime import datetime

from django.http import HttpResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.account.models import Medecin
from apps.account.permissions import (
    IsAnyMedecinOrHSSE,
    IsAuthenticatedOrOptions,
    MustChangePasswordPermission,
)
from apps.account.utils import get_site_utilisateur
from apps.hsee.services.export_medecins_activite_service import (
    TYPE_CONTROLEUR,
    TYPE_TRAITANT,
    TYPE_TRAVAIL,
    build_medecins_activite_workbook_bytes,
    validate_export_params,
)
from apps.hsee.services.medecin_export_role import (
    export_role_from_medecin,
    validate_medecin_id_for_export,
)

logger = logging.getLogger(__name__)


class HSEEMedecinsActiviteExportView(APIView):
    """
    GET /api/hsee/exports/medecins-activite/
    Query: date_debut, date_fin (YYYY-MM-DD), type_medecin?, medecin_id?
    """

    permission_classes = [
        MustChangePasswordPermission,
        IsAuthenticatedOrOptions,
        IsAnyMedecinOrHSSE,
    ]

    def get(self, request):
        dp = request.query_params.get("date_debut", "").strip()
        fp = request.query_params.get("date_fin", "").strip()
        try:
            date_debut = datetime.strptime(dp, "%Y-%m-%d").date() if dp else None
            date_fin = datetime.strptime(fp, "%Y-%m-%d").date() if fp else None
        except ValueError:
            return Response(
                {"detail": "date_debut et date_fin doivent être au format YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        err = validate_export_params(date_debut, date_fin)
        if err:
            return Response({"detail": err}, status=status.HTTP_400_BAD_REQUEST)

        raw_type = request.query_params.get("type_medecin", "").strip() or None
        type_medecin = None
        if raw_type:
            t = raw_type.lower()
            if t in (TYPE_TRAITANT, TYPE_TRAVAIL, TYPE_CONTROLEUR):
                type_medecin = t

        medecin_id = None
        mid = request.query_params.get("medecin_id", "").strip()
        if mid:
            try:
                medecin_id = int(mid)
            except ValueError:
                return Response(
                    {"detail": "medecin_id doit être un entier."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        _, err_med = validate_medecin_id_for_export(medecin_id, type_medecin)
        if err_med:
            return Response({"detail": err_med}, status=status.HTTP_400_BAD_REQUEST)

        data, err_xlsx, nb_detail = build_medecins_activite_workbook_bytes(
            date_debut,
            date_fin,
            type_medecin,
            medecin_id,
            site=get_site_utilisateur(request.user),
        )
        if err_xlsx:
            return Response({"detail": err_xlsx}, status=status.HTTP_400_BAD_REQUEST)

        role_suffix = "Tous"
        if type_medecin == TYPE_TRAITANT:
            role_suffix = "Traitant"
        elif type_medecin == TYPE_TRAVAIL:
            role_suffix = "Travail"
        elif type_medecin == TYPE_CONTROLEUR:
            role_suffix = "Controleur"

        fname = f"HSEE_Activite_Medecins_{role_suffix}_{date_debut}_{date_fin}.xlsx"
        fname = re.sub(r"[^\w.\-]", "_", fname)
        resp = HttpResponse(
            data,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        resp["Content-Disposition"] = f'attachment; filename="{fname}"'
        logger.info(
            "export_medecins_activite user=%s debut=%s fin=%s type=%s medecin_id=%s nb_detail=%s octets=%s",
            getattr(request.user, "pk", None),
            date_debut,
            date_fin,
            type_medecin,
            medecin_id,
            nb_detail,
            len(data) if data else 0,
        )
        return resp


def _nom_complet_export(m: Medecin) -> str:
    u = m.profile.user
    nom = (u.get_full_name() or "").strip()
    if not nom:
        nom = (u.username or "").strip() or f"#{m.pk}"
    if not nom.lower().startswith("dr."):
        nom = f"Dr. {nom}"
    return nom


class HSEEMedecinsPourExportView(APIView):
    """
    GET /api/hsee/medecins-pour-export/
    Query optionnel : type_medecin = tous | traitant | travail | controleur (défaut : tous).

    Réponse : [{ "id": <Medecin.pk>, "nom_complet": "Dr. ..." }, ...]
    """

    permission_classes = [
        MustChangePasswordPermission,
        IsAuthenticatedOrOptions,
        IsAnyMedecinOrHSSE,
    ]

    def get(self, request):
        raw = (request.query_params.get("type_medecin") or "tous").strip().lower()
        if raw in ("", "tous", "all"):
            filter_roles = None
        elif raw == TYPE_TRAITANT:
            filter_roles = {TYPE_TRAITANT}
        elif raw == TYPE_TRAVAIL:
            filter_roles = {TYPE_TRAVAIL}
        elif raw == TYPE_CONTROLEUR:
            filter_roles = {TYPE_CONTROLEUR}
        else:
            return Response(
                {
                    "detail": f"type_medecin doit être tous, {TYPE_TRAITANT}, {TYPE_TRAVAIL} ou {TYPE_CONTROLEUR}."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = Medecin.objects.select_related("profile__user", "med_type").filter(profile__user__is_active=True)
        site = get_site_utilisateur(request.user)
        if site is not None:
            qs = qs.filter(site=site)
        out: list[dict] = []
        for m in qs.order_by("profile__user__last_name", "profile__user__first_name", "id"):
            role = export_role_from_medecin(m)
            if role is None:
                continue
            if filter_roles is not None and role not in filter_roles:
                continue
            out.append({"id": m.id, "nom_complet": _nom_complet_export(m)})

        return Response(out)
