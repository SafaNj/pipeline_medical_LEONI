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
from apps.account.utils import (
    SiteScopedQuerysetCreateMixin,
    filter_queryset_by_user_site,
    get_site_utilisateur,
)
from apps.act_infirmier.permissions import IsInfirmier
from apps.control_visits.models import ContreVisite, LigneContreVisite, ListeContreVisite
from apps.control_visits.models.liste_contre_visite_models import renumeroter_lignes_liste_apres_suppression
from apps.control_visits.permissions import IsMedecinControleur
from apps.control_visits.serializers.liste_contre_visite_serializers import (
    LigneContreVisiteSerializer,
    ListeContreVisiteSerializer,
)
from apps.control_visits.contre_visite_sms import notifier_veille_liste_cv_manuelle
from apps.embauche.permissions import IsRH
from apps.medical_work.permissions import get_request_medecin

logger = logging.getLogger(__name__)


def _repos_initial_from_request(request_data):
    """
    Retourne (présent_dans_le_body, valeur_ou_None).
    Si la clé est absente : (False, None) — ne pas écraser une valeur existante en mise à jour.
    Si la clé est présente vide/null : (True, None) — effacer.
    Si la clé est présente avec un nombre : (True, int).
    """
    if 'repos_initial' not in request_data:
        return False, None
    raw = request_data.get('repos_initial')
    if raw is None:
        return True, None
    if isinstance(raw, str) and not str(raw).strip():
        return True, None
    try:
        v = int(raw)
    except (TypeError, ValueError):
        raise ValueError('repos_initial doit être un entier positif ou vide.')
    if v < 0:
        raise ValueError('repos_initial doit être un entier positif ou vide.')
    return True, v


def _dernier_jours_repos_certificat_traitant(collaborateur):
    """Repos prescrit par le médecin traitant : dernier certificat médical lié au collaborateur."""
    from apps.consultations.models import CertificatMedical

    cert = (
        CertificatMedical.objects.filter(consultation__collaborateur=collaborateur)
        .select_related('consultation')
        .order_by('-consultation__date_consultation', '-pk')
        .first()
    )
    return cert.jours_repos if cert else None


class ListeContreVisiteViewSet(SiteScopedQuerysetCreateMixin, viewsets.ModelViewSet):
    queryset = ListeContreVisite.objects.select_related(
        'medecin_controleur',
        'medecin_controleur__profile__user',
        'cree_par',
        'cree_par__user',
        'site',
    ).prefetch_related(
        Prefetch(
            'lignes',
            queryset=LigneContreVisite.objects.select_related(
                'collaborateur',
                'contre_visite',
            ).order_by('ordre', 'pk'),
        ),
    )
    serializer_class = ListeContreVisiteSerializer

    def _is_controller_medecin(self, medecin):
        med_type_name = ''
        if medecin and medecin.med_type and medecin.med_type.name:
            med_type_name = medecin.med_type.name
        name_lower = med_type_name.lower()
        # Support both "controleur" and "contrôleur" (with accent)
        return 'controleur' in name_lower or 'contrôleur' in name_lower

    def get_permissions(self):
        if self.action in {'list', 'retrieve'}:
            permissions = [MustChangePasswordPermission, IsAuthenticated, IsRH | IsInfirmier | IsMedecinControleur]
        elif self.action in {'create', 'update', 'partial_update', 'destroy'}:
            permissions = [MustChangePasswordPermission, IsAuthenticated, IsRH]
        elif self.action == 'soumettre':
            permissions = [MustChangePasswordPermission, IsAuthenticated, IsRH]
        elif self.action == 'archiver':
            permissions = [MustChangePasswordPermission, IsAuthenticated, IsRH]
        elif self.action in {'notifier_veille', 'notifier_veille_alias', 'sms_veille', 'send_sms_veille', 'rappel_veille', 'notifier_sms_veille', 'smsVeille'}:
            permissions = [MustChangePasswordPermission, IsAuthenticated, IsRH | IsInfirmier]
        elif self.action in {'assigner_medecin', 'cloturer', 'medecins_controleurs'}:
            permissions = [MustChangePasswordPermission, IsAuthenticated, IsInfirmier]
        else:
            permissions = [MustChangePasswordPermission, IsAuthenticated]
        return [permission() for permission in permissions]

    def get_queryset(self):
        """
        Périmètre site via mixin (`super()`). `?archived=true` → ARCHIVEE seulement ;
        sinon exclusion des archivées. Aligné sur embauche / surveillance spéciale.
        """
        qs = super().get_queryset()
        medecin = get_request_medecin(self.request)
        if medecin and medecin.site_id:
            qs = qs.filter(medecin_controleur=medecin)

        profile = getattr(self.request.user, 'profile', None)
        if not profile:
            return qs.none()
        role = (profile.role or '').strip().lower()

        if self.action == 'list':
            archived = self.request.query_params.get('archived', '').lower()
            if archived in ('true', '1', 'yes'):
                qs = qs.filter(statut=ListeContreVisite.STATUT_ARCHIVEE)
            else:
                qs = qs.exclude(statut=ListeContreVisite.STATUT_ARCHIVEE)
            qs = filter_queryset_by_user_site(qs, self.request.user)
            if role == 'rh':
                return qs
            if role in ('infirmier', 'infirmiere'):
                if archived in ('true', '1', 'yes'):
                    return qs
                return qs.filter(
                    statut__in=[
                        ListeContreVisite.STATUT_SOUMISE,
                        ListeContreVisite.STATUT_EN_TRAITEMENT,
                        ListeContreVisite.STATUT_CLOTUREE,
                    ]
                )
            if role == 'medecin' and medecin and self._is_controller_medecin(medecin):
                if archived in ('true', '1', 'yes'):
                    return qs
                return qs.filter(statut=ListeContreVisite.STATUT_EN_TRAITEMENT)
            return qs.none()

        if self.action == 'retrieve':
            return filter_queryset_by_user_site(qs, self.request.user)

        qs = qs.exclude(statut=ListeContreVisite.STATUT_ARCHIVEE)
        qs = filter_queryset_by_user_site(qs, self.request.user)
        if role == 'rh':
            return qs
        if role in ('infirmier', 'infirmiere'):
            return qs.filter(
                statut__in=[
                    ListeContreVisite.STATUT_SOUMISE,
                    ListeContreVisite.STATUT_EN_TRAITEMENT,
                    ListeContreVisite.STATUT_CLOTUREE,
                ]
            )
        if role == 'medecin' and medecin and self._is_controller_medecin(medecin):
            return qs.filter(statut=ListeContreVisite.STATUT_EN_TRAITEMENT)
        return qs.none()

    def _lecture_seule_si_archivee(self, liste):
        if liste.statut == ListeContreVisite.STATUT_ARCHIVEE:
            return Response(
                {'detail': 'Une liste archivée est en lecture seule.'},
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

    def perform_create(self, serializer):
        profile = getattr(self.request.user, 'profile', None)
        site = get_site_utilisateur(self.request.user)
        save_kwargs = {'cree_par': profile}
        if site is not None:
            save_kwargs['site'] = site
        serializer.save(**save_kwargs)

    def _run_notifier_veille(self, request, pk=None):
        liste = self.get_object()
        site = get_site_utilisateur(request.user)
        if site is not None:
            qs = filter_queryset_by_user_site(ListeContreVisite.objects.filter(pk=liste.pk), request.user)
            if not qs.exists():
                return Response(
                    {
                        'sent': False,
                        'detail': 'Liste hors du périmètre de votre site.',
                        'sms_count': 0,
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
        payload = notifier_veille_liste_cv_manuelle(liste)
        http_status = status.HTTP_200_OK if payload.get('sent') else status.HTTP_400_BAD_REQUEST
        return Response(payload, status=http_status)

    @action(detail=True, methods=['post'], url_path='notifier_veille')
    def notifier_veille(self, request, pk=None):
        """Envoi manuel des SMS veille (bouton RH / infirmier)."""
        return self._run_notifier_veille(request, pk)

    @action(detail=True, methods=['post'], url_path='notifier-veille')
    def notifier_veille_alias(self, request, pk=None):
        """Alias frontend éventuel."""
        return self._run_notifier_veille(request, pk)

    @action(detail=True, methods=['post'], url_path='sms_veille')
    def sms_veille(self, request, pk=None):
        """Alias frontend éventuel."""
        return self._run_notifier_veille(request, pk)

    @action(detail=True, methods=['post'], url_path='send_sms_veille')
    def send_sms_veille(self, request, pk=None):
        """Alias frontend éventuel."""
        return self._run_notifier_veille(request, pk)

    @action(detail=True, methods=['post'], url_path='rappel_veille')
    def rappel_veille(self, request, pk=None):
        """Alias frontend éventuel."""
        return self._run_notifier_veille(request, pk)

    @action(detail=True, methods=['post'], url_path='notifier_sms_veille')
    def notifier_sms_veille(self, request, pk=None):
        """Alias frontend éventuel."""
        return self._run_notifier_veille(request, pk)

    @action(detail=True, methods=['post'], url_path='smsVeille')
    def smsVeille(self, request, pk=None):
        """Alias frontend éventuel (camelCase)."""
        return self._run_notifier_veille(request, pk)

    @action(detail=True, methods=['patch'])
    def soumettre(self, request, pk=None):
        liste = self.get_object()
        err = self._lecture_seule_si_archivee(liste)
        if err is not None:
            return err
        if liste.statut != ListeContreVisite.STATUT_BROUILLON:
            return Response(
                {'detail': 'La liste doit être en brouillon pour être soumise.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not liste.lignes.exists():
            return Response(
                {'detail': 'La liste doit contenir au moins une ligne.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not liste.date_visite:
            return Response(
                {'detail': 'La date de visite est obligatoire.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        liste.statut = ListeContreVisite.STATUT_SOUMISE
        liste.date_modification = timezone.now()
        liste.save(update_fields=['statut', 'date_modification'])
        return Response(self.get_serializer(liste).data)

    @action(detail=True, methods=['patch'])
    def assigner_medecin(self, request, pk=None):
        liste = self.get_object()
        err = self._lecture_seule_si_archivee(liste)
        if err is not None:
            return err
        if liste.statut not in {ListeContreVisite.STATUT_SOUMISE, ListeContreVisite.STATUT_EN_TRAITEMENT}:
            return Response(
                {'detail': 'La liste doit être soumise ou en traitement.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        medecin_id = request.data.get('medecin_controleur_id')
        if not medecin_id:
            return Response(
                {'detail': 'medecin_controleur_id est requis.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            medecin = Medecin.objects.select_related('med_type', 'site', 'profile', 'profile__user').get(pk=medecin_id)
        except Medecin.DoesNotExist:
            return Response(
                {'detail': 'Médecin introuvable.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not self._is_controller_medecin(medecin):
            return Response(
                {"detail": "Le médecin sélectionné n'est pas un médecin contrôleur."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not medecin.site_id:
            return Response(
                {'detail': 'Le médecin doit avoir un site assigné.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if liste.site_id and medecin.site_id != liste.site_id:
            return Response(
                {'detail': 'Le médecin doit appartenir au même site que la liste.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        previous_statut = liste.statut
        liste.medecin_controleur = medecin
        liste.statut = ListeContreVisite.STATUT_EN_TRAITEMENT
        liste.date_modification = timezone.now()
        liste.save(update_fields=['medecin_controleur', 'statut', 'date_modification'])

        if previous_statut == ListeContreVisite.STATUT_SOUMISE:
            try:
                from apps.control_visits.contre_visite_sms import notifier_debut_file_contre_visite

                notifier_debut_file_contre_visite(liste)
            except Exception:
                logger.exception(
                    "SMS contre-visite : échec notifier_debut_file pour liste %s",
                    liste.reference,
                )

        return Response(self.get_serializer(liste).data)

    @action(detail=True, methods=['patch'])
    def cloturer(self, request, pk=None):
        liste = self.get_object()
        err = self._lecture_seule_si_archivee(liste)
        if err is not None:
            return err
        if liste.statut != ListeContreVisite.STATUT_EN_TRAITEMENT:
            return Response(
                {'detail': 'La liste doit être en traitement.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        lignes = list(liste.lignes.select_related('collaborateur', 'contre_visite'))
        lignes_a_reporter = [
            ligne for ligne in lignes
            if ligne.presence == LigneContreVisite.PRESENCE_ABSENT
            or ligne.presence == LigneContreVisite.PRESENCE_REPORTE
            or (ligne.presence == LigneContreVisite.PRESENCE_PRESENT and not ligne.verdict_saisi)
        ]

        nouvelle_liste = None
        with transaction.atomic():
            if lignes_a_reporter:
                nouvelle_liste = ListeContreVisite.objects.create(
                    cree_par=liste.cree_par,
                    site=liste.site,
                    date_visite=None,
                    medecin_controleur=None,
                    statut=ListeContreVisite.STATUT_BROUILLON,
                )
                for idx, ligne in enumerate(lignes_a_reporter, start=1):
                    LigneContreVisite.objects.create(
                        liste=nouvelle_liste,
                        collaborateur=ligne.collaborateur,
                        presence=LigneContreVisite.PRESENCE_EN_ATTENTE,
                        ordre=idx,
                    )

            liste.statut = ListeContreVisite.STATUT_CLOTUREE
            liste.date_modification = timezone.now()
            liste.save(update_fields=['statut', 'date_modification'])

        return Response(
            {
                'statut': liste.statut,
                'nombre_reportes': len(lignes_a_reporter),
                'nouvelle_liste_id': nouvelle_liste.id if nouvelle_liste else None,
            }
        )

    @action(detail=True, methods=['patch'], url_path='archiver')
    def archiver(self, request, pk=None):
        """
        RH uniquement. Passe une liste CLOTUREE en ARCHIVEE.
        PATCH /api/control-visits/listes-contre-visites/{id}/archiver/
        """
        liste = self.get_object()
        if liste.statut != ListeContreVisite.STATUT_CLOTUREE:
            return Response(
                {
                    'detail': (
                        'Seules les listes en statut CLOTUREE peuvent etre archivees.'
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        liste.statut = ListeContreVisite.STATUT_ARCHIVEE
        liste.date_modification = timezone.now()
        liste.save(update_fields=['statut', 'date_modification'])
        return Response(self.get_serializer(liste).data)

    @action(detail=False, methods=['get'])
    def medecins_controleurs(self, request):
        site = get_site_utilisateur(request.user)
        if site is None:
            return Response([])

        medecins = Medecin.objects.select_related('profile', 'profile__user', 'med_type', 'site').filter(site=site)
        medecins = [medecin for medecin in medecins if self._is_controller_medecin(medecin)]
        payload = []
        for medecin in medecins:
            # Safe access to profile and user
            user = getattr(getattr(medecin, 'profile', None), 'user', None)
            nom = (
                (medecin.nom_ar or '').strip()
                or (user.last_name if user else '')
                or (user.username if user else '')
                or f'Médecin #{medecin.id}'
            ).strip()
            prenom = (
                (medecin.prenom_ar or '').strip()
                or (user.first_name if user else '')
            ).strip()
            payload.append(
                {
                    'id': medecin.id,
                    'nom': nom or None,
                    'prenom': prenom or None,
                }
            )
        return Response(payload)


class LigneContreVisiteViewSet(SiteScopedQuerysetCreateMixin, viewsets.ModelViewSet):
    queryset = LigneContreVisite.objects.select_related(
        'liste',
        'liste__site',
        'collaborateur',
        'contre_visite',
        'contre_visite__medecin_controleur',
        'contre_visite__site',
    ).order_by('liste_id', 'ordre', 'pk')
    serializer_class = LigneContreVisiteSerializer

    def get_permissions(self):
        if self.action in {'list', 'retrieve'}:
            permissions = [MustChangePasswordPermission, IsAuthenticated, IsRH | IsInfirmier | IsMedecinControleur]
        elif self.action == 'create':
            permissions = [MustChangePasswordPermission, IsAuthenticated, IsRH | IsInfirmier]
        elif self.action == 'destroy':
            permissions = [MustChangePasswordPermission, IsAuthenticated, IsRH]
        elif self.action == 'presence':
            permissions = [MustChangePasswordPermission, IsAuthenticated, IsInfirmier]
        elif self.action == 'saisir_verdict':
            permissions = [MustChangePasswordPermission, IsAuthenticated, IsMedecinControleur]
        else:
            permissions = [MustChangePasswordPermission, IsAuthenticated]
        return [permission() for permission in permissions]

    def get_queryset(self):
        queryset = super().get_queryset()
        liste_id = self.request.query_params.get('liste')
        if liste_id:
            try:
                queryset = queryset.filter(liste_id=int(liste_id))
            except (TypeError, ValueError):
                return queryset.none()
        return queryset

    def create(self, request, *args, **kwargs):
        liste_id = request.data.get('liste') or request.data.get('liste_id')
        if not liste_id:
            return Response(
                {'detail': 'liste est requis.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            liste = ListeContreVisite.objects.get(pk=liste_id)
        except ListeContreVisite.DoesNotExist:
            return Response(
                {'detail': 'Liste introuvable.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Règles métier:
        # - Infirmier: ajout autorisé seulement si la liste est SOUMISE ou EN_TRAITEMENT (et même site)
        # - RH: ajout autorisé seulement si la liste est en BROUILLON
        if liste.statut == ListeContreVisite.STATUT_ARCHIVEE:
            return Response(
                {'detail': 'Impossible d’ajouter une ligne à une liste archivée.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if liste.statut == ListeContreVisite.STATUT_CLOTUREE:
            return Response(
                {'detail': 'Impossible d’ajouter une ligne à une liste clôturée.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile = getattr(request.user, 'profile', None)
        role = (getattr(profile, 'role', '') or '').strip().lower()
        is_rh = role == 'rh'
        is_infirmier = role in ('infirmier', 'infirmiere')

        if is_infirmier:
            if liste.statut not in {ListeContreVisite.STATUT_SOUMISE, ListeContreVisite.STATUT_EN_TRAITEMENT}:
                return Response(
                    {'detail': 'La liste doit être soumise ou en traitement pour ajouter une ligne.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            site = get_site_utilisateur(request.user)
            if not site or liste.site_id != site.id:
                return Response(
                    {'detail': 'Accès refusé : cette liste appartient à un autre site'},
                    status=status.HTTP_403_FORBIDDEN,
                )
        elif is_rh:
            if liste.statut != ListeContreVisite.STATUT_BROUILLON:
                return Response(
                    {'detail': 'La liste doit être en brouillon pour ajouter une ligne.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            return Response(
                {'detail': 'Accès refusé.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(liste=liste)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def _ligne_liste_archivee_response(self, ligne):
        if ligne.liste.statut == ListeContreVisite.STATUT_ARCHIVEE:
            return Response(
                {'detail': 'Une liste archivée est en lecture seule.'},
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

    def destroy(self, request, *args, **kwargs):
        ligne = self.get_object()
        err = self._ligne_liste_archivee_response(ligne)
        if err is not None:
            return err
        if ligne.liste.statut != ListeContreVisite.STATUT_BROUILLON:
            return Response(
                {'detail': 'Impossible de supprimer une ligne d’une liste déjà soumise.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)

    def perform_destroy(self, instance):
        liste_id = instance.liste_id
        super().perform_destroy(instance)
        renumeroter_lignes_liste_apres_suppression(liste_id)

    @action(detail=True, methods=['patch'])
    def presence(self, request, pk=None):
        ligne = self.get_object()
        err = self._ligne_liste_archivee_response(ligne)
        if err is not None:
            return err
        if ligne.liste.statut != ListeContreVisite.STATUT_EN_TRAITEMENT:
            return Response(
                {'detail': 'La liste doit être en traitement.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        presence = (request.data.get('presence') or '').strip().upper()
        allowed = {
            LigneContreVisite.PRESENCE_PRESENT,
            LigneContreVisite.PRESENCE_ABSENT,
            LigneContreVisite.PRESENCE_REPORTE,
        }
        if presence not in allowed:
            return Response(
                {'detail': 'presence doit être PRESENT, ABSENT ou REPORTE.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        raison_report = (request.data.get('raison_report') or '').strip()
        ligne.presence = presence
        ligne.raison_report = raison_report if presence == LigneContreVisite.PRESENCE_REPORTE else ''
        ligne.save(update_fields=['presence', 'raison_report'])
        return Response(
            {
                'presence': ligne.presence,
                'raison_report': ligne.raison_report,
            }
        )

    @action(detail=True, methods=['patch'])
    def saisir_verdict(self, request, pk=None):
        ligne = self.get_object()
        err = self._ligne_liste_archivee_response(ligne)
        if err is not None:
            return err
        if ligne.presence != LigneContreVisite.PRESENCE_PRESENT:
            return Response(
                {'detail': 'Impossible de saisir un verdict pour un collaborateur absent ou reporté'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        collaborateur = ligne.collaborateur
        if not collaborateur:
            return Response(
                {'detail': 'Collaborateur introuvable sur la ligne.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        medecin = get_request_medecin(request)
        if medecin is None:
            return Response(
                {'detail': 'Médecin contrôleur introuvable.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        duree_repos = request.data.get('duree_repos')
        try:
            duree_repos = int(duree_repos)
        except (TypeError, ValueError):
            return Response(
                {'detail': 'duree_repos doit être un entier.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        refus_repos_raw = request.data.get('refus_repos', False)
        refus_repos = str(refus_repos_raw).strip().lower() in {'1', 'true', 'yes', 'oui', 'on'}

        a_partir = parse_date(str(request.data.get('a_partir') or '').strip())
        if not a_partir:
            return Response(
                {'detail': 'a_partir est requis et doit être une date valide.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        remarque = (request.data.get('remarque') or '').strip()
        nom = (getattr(collaborateur, 'nom', '') or '').strip()
        prenom = (getattr(collaborateur, 'prenom', '') or '').strip()
        nom_prenom = f'{nom} {prenom}'.strip() or collaborateur.matricule

        try:
            ri_in_body, ri_value = _repos_initial_from_request(request.data)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if ligne.contre_visite:
            contre_visite = ligne.contre_visite
            contre_visite.matricule = collaborateur.matricule
            contre_visite.nom_prenom = nom_prenom
            contre_visite.duree_repos = duree_repos
            contre_visite.refus_repos = refus_repos
            contre_visite.a_partir = a_partir
            contre_visite.date = timezone.localdate()
            contre_visite.remarque = remarque
            contre_visite.medecin_controleur = medecin
            contre_visite.site = ligne.liste.site
            if ri_in_body:
                contre_visite.repos_initial = ri_value
            contre_visite.save()
        else:
            repos_initial = (
                ri_value if ri_in_body else _dernier_jours_repos_certificat_traitant(collaborateur)
            )
            contre_visite = ContreVisite.objects.create(
                matricule=collaborateur.matricule,
                nom_prenom=nom_prenom,
                duree_repos=duree_repos,
                refus_repos=refus_repos,
                repos_initial=repos_initial,
                a_partir=a_partir,
                date=timezone.localdate(),
                remarque=remarque,
                medecin_controleur=medecin,
                site=ligne.liste.site,
            )
            ligne.contre_visite = contre_visite

        ligne.verdict_saisi = True
        ligne.save(update_fields=['contre_visite_id', 'verdict_saisi'])

        try:
            from apps.control_visits.contre_visite_sms import notifier_n_plus_2_apres_verdict

            notifier_n_plus_2_apres_verdict(ligne)
        except Exception:
            logger.exception(
                "SMS contre-visite : échec N+2 après verdict ligne %s",
                ligne.pk,
            )

        return Response(self.get_serializer(ligne).data)
