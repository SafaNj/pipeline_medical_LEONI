# apps/embauche/views/liste_viewsets.py
import logging

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
from django.utils.dateparse import parse_date

from apps.account.models import Medecin
from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import (
    filter_queryset_by_user_site,
    get_site_save_kwargs_for_serializer,
    get_site_utilisateur,
)
from apps.embauche.embauche_sms import (
    notifier_debut_file_si_transition_soumise_en_traitement,
    notifier_veille_liste_embauche_manuelle,
)
from apps.embauche.im_sync import update_med_fields_in_im
from apps.embauche.models import CandidatEmbauche, ListeEmbauche
from apps.embauche.permissions import (
    IsInfirmierRole,
    IsRH,
    IsRHOrInfirmier,
    IsRHOrInfirmierOrMedecinTravail,
    IsRHOrInfirmierOrMedecinTravailOrHSSE,
)
from apps.medical_work.permissions import IsMedecinTravail
from apps.embauche.serializers import (
    ListeEmbaucheDetailSerializer,
    ListeEmbaucheSerializer,
)
from apps.embauche.views.export_view import export_liste_embauche
from apps.account.models import Profile
from apps.medical_work.permissions import get_request_medecin


logger = logging.getLogger(__name__)


def _notify_rh_new_report_list(report_list, source_list, reported_count):
    """
    Notifie RH qu'une nouvelle liste reportée a été générée automatiquement.
    Retourne le nombre de destinataires notifiés.
    """
    site = getattr(getattr(source_list, "medecin", None), "site", None)
    rh_qs = Profile.objects.select_related("user").filter(role="rh", user__is_active=True)
    if site is not None:
        rh_qs = rh_qs.filter(rh__site=site)
    rh_emails = list(
        rh_qs.exclude(user__email__isnull=True)
        .exclude(user__email__exact="")
        .values_list("user__email", flat=True)
    )
    if not rh_emails:
        logger.info(
            "[embauche] Nouvelle liste reportee %s generee (aucun email RH configure).",
            report_list.id,
        )
        return 0

    subject = f"[Embauche] Nouvelle liste reportee {report_list.reference}"
    message = (
        f"Une nouvelle liste reportee a ete generee automatiquement.\n\n"
        f"Liste source: {source_list.reference}\n"
        f"Nouvelle liste: {report_list.reference}\n"
        f"Nombre de candidats reportes: {reported_count}\n"
    )
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@medical.local")
    try:
        send_mail(subject, message, from_email, rh_emails, fail_silently=True)
        return len(rh_emails)
    except Exception as e:
        logger.warning(
            "[embauche] Echec notification RH liste reportee id=%s: %s",
            report_list.id,
            e,
        )
        return 0


# Permission locale : infirmier OU médecin du travail
# Utilisée pour l'action 'soumises' — le médecin doit voir ses listes assignées
class IsInfirmierOrMedecinTravail(IsInfirmierRole):
    def has_permission(self, request, view):
        if super().has_permission(request, view):
            return True
        return IsMedecinTravail().has_permission(request, view)


class ListeEmbaucheViewSet(viewsets.ModelViewSet):
    queryset = ListeEmbauche.objects.select_related(
        'cree_par__user',
        'medecin__profile__user',
        'medecin__med_type',
    ).prefetch_related('candidats')

    def get_queryset(self):
        qs = super().get_queryset()
        medecin = get_request_medecin(self.request)
        if medecin and medecin.site_id:
            qs = qs.filter(medecin=medecin)
        if self.action == 'list':
            archived = self.request.query_params.get('archived', '').lower()
            if archived in ('true', '1', 'yes'):
                qs = qs.filter(statut=ListeEmbauche.STATUT_ARCHIVEE)
                return filter_queryset_by_user_site(qs, self.request.user)
            qs = qs.exclude(statut=ListeEmbauche.STATUT_ARCHIVEE)
            return filter_queryset_by_user_site(qs, self.request.user)
        if self.action in ('retrieve', 'export'):
            return filter_queryset_by_user_site(qs, self.request.user)
        qs = qs.exclude(statut=ListeEmbauche.STATUT_ARCHIVEE)
        return filter_queryset_by_user_site(qs, self.request.user)

    def get_serializer_class(self):
        if self.action == 'list':
            return ListeEmbaucheSerializer
        return ListeEmbaucheDetailSerializer

    def get_permissions(self):
        base = [MustChangePasswordPermission, IsAuthenticated]

        if self.action in ['create', 'destroy', 'soumettre', 'update', 'partial_update']:
            specific = [IsRH]
        elif self.action == 'archiver':
            specific = [IsRH]
        elif self.action in ['cloturer', 'assigner_medecin', 'passer_en_traitement']:
            specific = [IsInfirmierRole]
        elif self.action == 'soumises':
            # Infirmier ET médecin du travail peuvent voir les listes soumises
            specific = [IsInfirmierOrMedecinTravail]
        elif self.action == "medecins_travail":
            specific = [IsRHOrInfirmierOrMedecinTravailOrHSSE]
        elif self.action in ["list", "retrieve", "export"]:
            # RH, infirmier ET médecin du travail
            specific = [IsRHOrInfirmierOrMedecinTravail]
        elif self.action in ("notifier_veille", "sms_veille", "send_sms_veille"):
            specific = [IsRHOrInfirmier]
        else:
            specific = [IsRHOrInfirmier]

        return [permission() for permission in (*base, *specific)]

    def perform_create(self, serializer):
        profile = getattr(self.request.user, 'profile', None)
        site_kwargs = get_site_save_kwargs_for_serializer(serializer, self.request.user)
        serializer.save(cree_par=profile, **site_kwargs)

    @action(detail=False, methods=['get'])
    def medecins_travail(self, request):
        """
        GET /api/embauche/listes/medecins_travail/
        Retourne la liste des médecins du travail actifs.
        Accessible à RH et Infirmier.
        """
        medecins = Medecin.objects.select_related(
            'profile__user', 'med_type'
        ).filter(
            med_type__name__icontains='travail',
            profile__user__is_active=True,
        )
        user_site = get_site_utilisateur(request.user)
        if user_site is not None:
            medecins = medecins.filter(site=user_site)

        data = []
        for m in medecins:
            first = m.profile.user.first_name or ''
            last  = m.profile.user.last_name  or ''
            nom_complet = f"{first} {last}".strip() or m.profile.user.username
            data.append({
                'id':          m.id,
                'nom_complet': nom_complet,
                'username':    m.profile.user.username,
                'specialite':  m.specialite or '',
                'grade':       m.grade or '',
            })

        return Response(data)

    @action(detail=True, methods=['patch'])
    def soumettre(self, request, pk=None):
        liste = self.get_object()

        if liste.statut != ListeEmbauche.STATUT_BROUILLON:
            return Response(
                {'error': 'La liste doit etre en BROUILLON pour etre soumise'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not liste.candidats.exists():
            return Response(
                {'error': 'La liste ne contient aucun candidat'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        date_visite_from_body = False
        if 'date_visite' in request.data and request.data.get('date_visite') not in (None, ''):
            parsed = parse_date(str(request.data.get('date_visite')).strip())
            if parsed is None:
                return Response(
                    {
                        'code': 'DATE_VISITE_INVALIDE',
                        'error': 'date_visite invalide (format attendu: AAAA-MM-JJ)',
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            liste.date_visite = parsed
            date_visite_from_body = True

        if not liste.date_visite:
            return Response(
                {
                    'code': 'DATE_VISITE_REQUISE',
                    'error': 'Définissez une date de visite avant de soumettre cette liste.',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        update_fields = ['statut', 'date_modification']
        if date_visite_from_body:
            update_fields.insert(0, 'date_visite')

        liste.statut = ListeEmbauche.STATUT_SOUMISE
        liste.save(update_fields=update_fields)
        return Response({'status': 'Liste soumise'})

    @action(detail=True, methods=['patch'])
    def passer_en_traitement(self, request, pk=None):
        """
        Infirmier : SOUMISE -> EN_TRAITEMENT sans PATCH sur la ressource liste (réservé au RH).
        À utiliser lorsque la liste est prête pour la visite (ex. présences complètes).
        PATCH /api/embauche/listes/{id}/passer_en_traitement/
        """
        liste = self.get_object()
        if liste.statut != ListeEmbauche.STATUT_SOUMISE:
            return Response(
                {
                    'error': (
                        'La liste doit etre en SOUMISE pour passer en traitement '
                        f'(statut actuel: {liste.statut}).'
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        statut_avant = liste.statut
        liste.statut = ListeEmbauche.STATUT_EN_TRAITEMENT
        liste.save(update_fields=['statut', 'date_modification'])
        notifier_debut_file_si_transition_soumise_en_traitement(liste, statut_avant)
        serializer = self.get_serializer(liste)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def cloturer(self, request, pk=None):
        liste = self.get_object()

        if liste.statut != ListeEmbauche.STATUT_EN_TRAITEMENT:
            return Response(
                {'error': 'La liste doit etre en EN_TRAITEMENT pour etre cloturee'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reported_candidates = []
        created_report_list = None

        with transaction.atomic():
            for candidat in liste.candidats.all():
                if (
                    candidat.presence == CandidatEmbauche.PRESENCE_ABSENT
                    or candidat.presence == CandidatEmbauche.PRESENCE_NON_RENSEIGNEE
                    or (
                        candidat.presence == CandidatEmbauche.PRESENCE_PRESENT
                        and not candidat.fiche_aptitude_id
                    )
                ):
                    try:
                        update_med_fields_in_im(
                            candidat.matricule,
                            med_statut_integration='REPORTE',
                        )
                    except Exception as e:
                        logger.warning(
                            "[embauche] Echec sync im_db statut REPORTE, matricule=%s liste_id=%s: %s",
                            candidat.matricule,
                            liste.id,
                            e,
                        )
                    reported_candidates.append(candidat)

            if reported_candidates:
                # Liste de rattrapage : pas de médecin assigné (réassignation RH / infirmier plus tard)
                created_report_list = ListeEmbauche.objects.create(
                    date_visite=None,
                    statut=ListeEmbauche.STATUT_BROUILLON,
                    medecin=None,
                    cree_par=liste.cree_par,
                )

                cloned_candidates = []
                for candidat in reported_candidates:
                    cloned_candidates.append(
                        CandidatEmbauche(
                            liste=created_report_list,
                            ligne_source=candidat.ligne_source,
                            matricule=candidat.matricule,
                            nom=candidat.nom,
                            prenom=candidat.prenom,
                            cin=candidat.cin,
                            numero_cnss=candidat.numero_cnss,
                            date_naissance=candidat.date_naissance,
                            genre=candidat.genre,
                            telephone=candidat.telephone,
                            gouvernorat=candidat.gouvernorat,
                            niveau=candidat.niveau,
                            num_demande=candidat.num_demande,
                            ps=candidat.ps,
                            projet=candidat.projet,
                            date_recrutement=candidat.date_recrutement,
                            centre_cout=candidat.centre_cout,
                            poste=candidat.poste,
                            department=candidat.department,
                            source_information=candidat.source_information,
                            formation=candidat.formation,
                            presence=candidat.presence,  # Conserver la présence originale (ABSENT/NON_RENSEIGNEE)
                            etat_embauche=CandidatEmbauche.ETAT_EN_ATTENTE,
                            statut_integration=CandidatEmbauche.STATUT_INTEGRATION_EN_ATTENTE_VISITE,
                            observations_medecin='',
                        )
                    )
                CandidatEmbauche.objects.bulk_create(cloned_candidates)

            liste.statut = ListeEmbauche.STATUT_CLOTUREE
            liste.save(update_fields=['statut', 'date_modification'])

        rh_notified_count = 0
        if created_report_list:
            rh_notified_count = _notify_rh_new_report_list(
                created_report_list,
                liste,
                len(reported_candidates),
            )

        return Response({
            'status': 'Liste cloturee',
            'nombre_reportes': len(reported_candidates),
            'nouvelle_liste_reportee_id': created_report_list.id if created_report_list else None,
            'nouvelle_liste_reportee_reference': (
                created_report_list.reference if created_report_list else None
            ),
            'rh_notifies_count': rh_notified_count,
        })

    @action(detail=True, methods=['patch'])
    def archiver(self, request, pk=None):
        """
        RH uniquement. Passe une liste CLOTUREE en ARCHIVEE.
        PATCH /api/embauche/listes/{id}/archiver/
        """
        liste = self.get_object()
        if liste.statut != ListeEmbauche.STATUT_CLOTUREE:
            return Response(
                {
                    'error': (
                        'Seules les listes en statut CLOTUREE peuvent etre archivees.'
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        liste.statut = ListeEmbauche.STATUT_ARCHIVEE
        liste.save(update_fields=['statut', 'date_modification'])
        return Response(
            {
                'id': liste.id,
                'statut': liste.statut,
                'reference': liste.reference,
            }
        )

    def _run_notifier_veille(self, request, pk=None):
        liste = self.get_object()
        site = get_site_utilisateur(request.user)
        if site is not None:
            qs = filter_queryset_by_user_site(ListeEmbauche.objects.filter(pk=liste.pk), request.user)
            if not qs.exists():
                return Response(
                    {
                        'sent': False,
                        'detail': 'Liste hors du périmètre de votre site.',
                        'sms_count': 0,
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
        payload = notifier_veille_liste_embauche_manuelle(liste)
        http_status = (
            status.HTTP_200_OK if payload['sent'] else status.HTTP_400_BAD_REQUEST
        )
        return Response(payload, status=http_status)

    @action(detail=True, methods=['post'], url_path='notifier_veille')
    def notifier_veille(self, request, pk=None):
        """Envoi manuel des SMS veille (bouton RH / infirmier)."""
        return self._run_notifier_veille(request, pk)

    @action(detail=True, methods=['post'], url_path='sms_veille')
    def sms_veille(self, request, pk=None):
        return self._run_notifier_veille(request, pk)

    @action(detail=True, methods=['post'], url_path='send_sms_veille')
    def send_sms_veille(self, request, pk=None):
        return self._run_notifier_veille(request, pk)

    @action(detail=True, methods=['get'])
    def export(self, request, pk=None):
        liste = self.get_object()
        return export_liste_embauche(liste)

    @action(detail=False, methods=['get'])
    def soumises(self, request):
        queryset = self.get_queryset().filter(
            statut__in=[
                ListeEmbauche.STATUT_SOUMISE,
                ListeEmbauche.STATUT_EN_TRAITEMENT,
            ]
        ).order_by('date_visite')

        # Si l'utilisateur est un médecin du travail :
        # filtrer uniquement les listes qui lui sont assignées
        if IsMedecinTravail().has_permission(request, self):
            try:
                from apps.account.models import Medecin
                medecin = Medecin.objects.get(profile__user=request.user)
                queryset = queryset.filter(medecin=medecin)
            except Exception as e:
                logger.warning(
                    "[embauche] Impossible de filtrer les listes soumises pour user_id=%s: %s",
                    request.user.id,
                    e,
                )
                queryset = queryset.none()

        # Utilise ListeEmbaucheSerializer (pas Detail) pour avoir nombre_presents/aptes/candidats
        # nécessaires pour la barre de progression dans le dashboard infirmier
        serializer = ListeEmbaucheSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def assigner_medecin(self, request, pk=None):
        liste = self.get_object()
        user_site = get_site_utilisateur(request.user)

        if liste.statut not in [ListeEmbauche.STATUT_SOUMISE, ListeEmbauche.STATUT_EN_TRAITEMENT]:
            return Response(
                {'error': 'La liste doit etre SOUMISE ou EN_TRAITEMENT pour assigner un medecin'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        medecin_id = request.data.get('medecin')
        if not medecin_id:
            return Response(
                {'error': 'Le champ medecin est requis'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            medecin = Medecin.objects.select_related('med_type', 'profile__user').get(pk=medecin_id)
        except Medecin.DoesNotExist:
            return Response({'error': 'Medecin introuvable'}, status=status.HTTP_400_BAD_REQUEST)

        med_type_name = ''
        if medecin.med_type and medecin.med_type.name:
            med_type_name = medecin.med_type.name.lower()

        if 'travail' not in med_type_name:
            return Response(
                {'error': 'Le medecin assigne doit etre un medecin du travail'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user_site is not None and medecin.site_id != user_site.id:
            return Response(
                {'error': 'Le medecin assigne doit appartenir au meme site.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        liste.medecin = medecin
        liste.save(update_fields=['medecin', 'date_modification'])

        serializer = self.get_serializer(liste)
        return Response(serializer.data)