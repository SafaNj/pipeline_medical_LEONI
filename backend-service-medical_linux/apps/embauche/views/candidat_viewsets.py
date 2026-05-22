# apps/embauche/views/candidat_viewsets.py
import logging

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction, IntegrityError

from apps.account.models import Medecin
from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import (
    filter_queryset_by_user_site,
    get_im_site_code_for_persist,
    get_im_site_filter_from_request,
    get_site_utilisateur,
    im_site_required_but_missing,
)
from apps.medical_work.permissions import IsSameSiteOrAssignedMedecin, get_request_medecin
from apps.embauche.im_sync import (
    get_data_from_im,
    update_cnss_in_im,
    update_med_fields_in_im,
    upsert_resource_in_im,
)
from apps.embauche.models import CandidatEmbauche, ListeEmbauche
from apps.embauche.permissions import IsInfirmierRole, IsRH, IsRHOrInfirmier, IsRHOrInfirmierOrMedecinTravail
from apps.embauche.serializers import (
    CandidatEmbaucheSerializer,
    CandidatMedecinUpdateSerializer,
    CandidatRHUpdateSerializer,
    CandidatUpdateSerializer,
)
from apps.embauche.views.upload_view import _clean_date
from apps.medical_records.models import DossierMedical
from apps.medical_work.models import FicheAptitude
from apps.medical_work.permissions import IsMedecinTravail
from apps.medical_work.serializers import DemandeBilanSerializer, DemandeExamenSerializer
from apps.employees.models import Collaborateur
from apps.employees.models import ResourceIM
from apps.medical_work.views.mixins import SiteScopedObjectMixin


logger = logging.getLogger(__name__)


def _im_int_or_none(value):
    if value is None:
        return None
    s = str(value).strip()
    if not s:
        return None
    return int(s) if s.isdigit() else None


def _build_med_sync_payload(candidat, validator_username):
    """
    Construit les champs med_* à pousser vers im_db.resource.
    """
    payload = {
        'med_statut_integration': CandidatEmbauche.STATUT_INTEGRATION_INTEGRE,
        'med_date_integration': timezone.localdate(),
        'med_validateur_integration': (validator_username or '')[:20],
    }

    # Si une fiche existe, on complète les champs de visite/aptitude.
    fiche = getattr(candidat, 'fiche_aptitude', None)
    if fiche:
        payload.update(
            {
                'med_visite_embauche_effectuee': True,
                'med_date_visite_embauche': fiche.date_visite,
                'med_resultat_aptitude': fiche.aptitude,
                'med_date_resultat_aptitude': timezone.localdate(),
            }
        )
    return payload


class CandidatEmbaucheViewSet(SiteScopedObjectMixin, viewsets.ModelViewSet):
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    queryset = CandidatEmbauche.objects.select_related(
        'liste', 'fiche_aptitude',
        'fiche_aptitude__collaborateur', 'collaborateur',
        'fiche_aptitude__medecin_travail',
    ).prefetch_related(
        'fiche_aptitude__demandes_examen',
        'fiche_aptitude__demandes_bilan',
    )

    def get_queryset(self):
        qs = super().get_queryset()
        medecin = get_request_medecin(self.request)
        if medecin and medecin.site_id:
            qs = qs.filter(liste__medecin=medecin)
        liste_id = self.request.query_params.get('liste')
        if liste_id:
            try:
                qs = qs.filter(liste_id=int(liste_id))
            except (ValueError, TypeError):
                qs = qs.none()
        return filter_queryset_by_user_site(qs, self.request.user)

    def perform_update(self, serializer):
        old_fiche_id = serializer.instance.fiche_aptitude_id
        super().perform_update(serializer)
        instance = serializer.instance
        if (
            self.action == 'partial_update'
            and old_fiche_id is None
            and instance.fiche_aptitude_id
        ):
            try:
                from apps.embauche.embauche_sms import notifier_n_plus_2_apres_fiche_embauche

                notifier_n_plus_2_apres_fiche_embauche(instance)
            except Exception:
                logger.exception(
                    'SMS embauche N+2 après fiche (PATCH candidat=%s)', instance.pk
                )

        if self.action != 'partial_update':
            return
        if not IsRH().has_permission(self.request, self):
            return
        validated = getattr(serializer, 'validated_data', None) or {}
        if 'numero_cnss' not in validated:
            return
        instance.refresh_from_db()
        try:
            ok = update_cnss_in_im(instance.matricule, instance.numero_cnss)
            if not ok:
                logger.warning(
                    '[embauche] CNSS non synchronise vers im_db (ressource absente ou erreur), matricule=%s',
                    instance.matricule,
                )
        except Exception as e:
            logger.warning(
                '[embauche] Echec sync CNSS vers im_db matricule=%s: %s',
                getattr(instance, 'matricule', None),
                e,
                exc_info=True,
            )

    def _build_im_resource_map(self, candidats):
        matricules = []
        for c in candidats:
            m = str(getattr(c, "matricule", "") or "").strip()
            if m.isdigit():
                matricules.append(int(m))
        if not matricules:
            return {}
        im_site = get_im_site_filter_from_request(self.request)
        if im_site is False:
            return {}
        try:
            qs = ResourceIM.objects.using("im_db").filter(matricule__in=matricules)
            if im_site:
                qs = qs.filter(site=im_site)
            resources = qs
        except Exception:
            return {}
        return {str(r.matricule): r for r in resources}

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        instances = page if page is not None else queryset
        context = self.get_serializer_context()
        context["im_resource_map"] = self._build_im_resource_map(instances)
        serializer = self.get_serializer(instances, many=True, context=context)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        context = self.get_serializer_context()
        context["im_resource_map"] = self._build_im_resource_map([instance])
        serializer = self.get_serializer(instance, context=context)
        return Response(serializer.data)

    def get_serializer_class(self):
        if self.action == 'observations':
            return CandidatMedecinUpdateSerializer
        if self.action == 'partial_update':
            if IsRH().has_permission(self.request, self):
                return CandidatRHUpdateSerializer
            return CandidatUpdateSerializer
        return CandidatEmbaucheSerializer

    def get_permissions(self):
        base = [MustChangePasswordPermission, IsAuthenticated]
        base.append(IsSameSiteOrAssignedMedecin)
        if self.action == 'a_examiner':
            # Lecture des candidats à examiner : médecin du travail uniquement
            specific = [IsMedecinTravail]
        elif self.action in ['list', 'retrieve']:
            # Lecture : RH + infirmier + médecin du travail
            specific = [IsRHOrInfirmierOrMedecinTravail]
        elif self.action in ['observations', 'rattacher_fiche']:
            # Actions médicales : médecin du travail uniquement
            specific = [IsMedecinTravail]
        elif self.action in [
            'changer_statut_integration',
            'sync_depuis_im',
            'creer_collaborateur',
            'creer_collaborateur_par_matricule',
            'recherche_im',
            'documents_medecin',
        ]:
            # Suivi intégration : RH et infirmier
            # creer_collaborateur est déclenché depuis le dashboard RH (onglet Suivi intégration)
            specific = [IsRHOrInfirmier]
        elif self.action in ['presence']:
            # Pointage présence : infirmier (et RH en lecture de la liste)
            specific = [IsRHOrInfirmier]
        elif self.action == 'notifier_jour_j':
            specific = [IsRHOrInfirmierOrMedecinTravail]
        elif self.action in ['partial_update', 'create', 'destroy']:
            # CRUD candidat : RH uniquement
            specific = [IsRH]
        else:
            specific = [IsInfirmierRole]
        return [permission() for permission in (*base, *specific)]

    # ─── CREATE ──────────────────────────────────────────────────────────────
    def create(self, request, *args, **kwargs):
        """
        POST /api/embauche/candidats/
        Ajoute un seul candidat à une liste existante (saisie manuelle).
        N'efface PAS les candidats existants (contrairement à upload/confirmer).
        """
        liste_id = request.data.get('liste_id')
        if not liste_id:
            return Response({'error': 'liste_id est requis'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            liste = ListeEmbauche.objects.get(pk=liste_id)
        except ListeEmbauche.DoesNotExist:
            return Response({'error': 'Liste introuvable'}, status=status.HTTP_404_NOT_FOUND)

        if liste.statut != ListeEmbauche.STATUT_BROUILLON:
            return Response(
                {'error': "Impossible d'ajouter un candidat à une liste déjà soumise."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        matricule = str(request.data.get('matricule') or '').strip()
        nom       = str(request.data.get('nom') or '').strip()
        prenom    = str(request.data.get('prenom') or '').strip()

        if not nom or not prenom or not matricule:
            return Response(
                {'error': 'nom, prenom et matricule sont obligatoires.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if liste.candidats.filter(matricule=matricule).exists():
            return Response(
                {'error': f'Un candidat avec le matricule {matricule} existe déjà dans cette liste.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        im_data = (
            get_data_from_im(matricule, user_site=get_im_site_filter_from_request(request))
            or {}
        )

        _cnss = request.data.get('numero_cnss')
        if _cnss is None and 'cnss' in request.data:
            _cnss = request.data.get('cnss')
        if _cnss is None:
            _cnss = im_data.get('numero_cnss') or im_data.get('cnss') or ''

        candidat = CandidatEmbauche.objects.create(
            liste=liste,
            nom=nom or (im_data.get('nom') or '').strip(),
            prenom=prenom or (im_data.get('prenom') or '').strip(),
            matricule=matricule,
            cin=str(request.data.get('cin') or im_data.get('cin') or '').strip(),
            numero_cnss=str(_cnss).strip() if _cnss is not None else '',
            date_naissance=_clean_date(request.data.get('date_naissance') or im_data.get('date_naissance')),
            genre=str(request.data.get('genre') or im_data.get('genre') or '').strip(),
            telephone=str(request.data.get('telephone') or im_data.get('telephone') or '').strip(),
            gouvernorat=str(
                request.data.get('gouvernorat')
                or im_data.get('gouvernorat')
                or im_data.get('gouvernerat')
                or ''
            ).strip(),
            niveau=str(request.data.get('niveau') or '').strip(),
            poste=str(request.data.get('poste') or im_data.get('poste') or im_data.get('fonction') or '').strip(),
            department=str(request.data.get('department') or im_data.get('department') or '').strip(),
            projet=str(request.data.get('projet') or '').strip(),
            date_recrutement=_clean_date(request.data.get('date_recrutement')),
            centre_cout=str(request.data.get('centre_cout') or '').strip(),
            source_information=str(request.data.get('source_information') or '').strip(),
            formation=str(request.data.get('formation') or '').strip(),
            num_demande=str(request.data.get('num_demande') or '').strip(),
            ps=str(request.data.get('ps') or '').strip(),
            ligne_source=liste.candidats.count() + 1,
        )

        # Garantit la persistance de la saisie manuelle dans im_db.resource.
        upsert_resource_in_im(
            matricule=matricule,
            nom=candidat.nom,
            prenom=candidat.prenom,
            cin=candidat.cin,
            date_naissance=candidat.date_naissance,
            genre=candidat.genre,
            telephone=candidat.telephone,
            gouvernorat=candidat.gouvernorat,
            poste=candidat.poste,
            department=candidat.department,
            site=get_im_site_code_for_persist(request),
        )

        return Response(
            CandidatEmbaucheSerializer(candidat).data,
            status=status.HTTP_201_CREATED,
        )

    # ─── DESTROY ─────────────────────────────────────────────────────────────
    def destroy(self, request, *args, **kwargs):
        candidat = self.get_object()
        if candidat.liste.statut != ListeEmbauche.STATUT_BROUILLON:
            return Response(
                {'error': "Impossible de supprimer un candidat d'une liste déjà soumise."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        candidat.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ─── ACTIONS ─────────────────────────────────────────────────────────────

    @action(detail=False, methods=['get'])
    def a_examiner(self, request):
        try:
            medecin = Medecin.objects.get(profile__user=request.user)
        except Medecin.DoesNotExist:
            return Response({'error': 'Medecin introuvable'}, status=status.HTTP_404_NOT_FOUND)
        qs = CandidatEmbauche.objects.select_related(
            'liste', 'fiche_aptitude', 'fiche_aptitude__collaborateur', 'collaborateur',
        ).filter(
            liste__medecin=medecin,
            presence=CandidatEmbauche.PRESENCE_PRESENT,
            fiche_aptitude__isnull=True,
        )
        return Response(CandidatEmbaucheSerializer(qs, many=True).data)

    @action(detail=True, methods=['patch'])
    def presence(self, request, pk=None):
        candidat = self.get_object()
        value = request.data.get('presence')
        if value not in [CandidatEmbauche.PRESENCE_PRESENT, CandidatEmbauche.PRESENCE_ABSENT]:
            return Response(
                {'error': 'presence doit etre PRESENT ou ABSENT'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        was_unset = candidat.presence == CandidatEmbauche.PRESENCE_NON_RENSEIGNEE
        candidat.presence = value
        candidat.save(update_fields=['presence'])

        liste = ListeEmbauche.objects.get(pk=candidat.liste_id)
        statut_liste_avant = liste.statut
        if was_unset and liste.statut in [
            ListeEmbauche.STATUT_BROUILLON, ListeEmbauche.STATUT_SOUMISE
        ]:
            liste.statut = ListeEmbauche.STATUT_EN_TRAITEMENT
            liste.save(update_fields=['statut', 'date_modification'])
        elif liste.statut == ListeEmbauche.STATUT_SOUMISE:
            # Import ou données déjà renseignées : sans passage par NON_RENSEIGNEE,
            # la liste pouvait rester SOUMISE alors que toutes les présences sont connues.
            if not liste.candidats.filter(
                presence=CandidatEmbauche.PRESENCE_NON_RENSEIGNEE
            ).exists():
                liste.statut = ListeEmbauche.STATUT_EN_TRAITEMENT
                liste.save(update_fields=['statut', 'date_modification'])

        liste.refresh_from_db(fields=['statut'])
        if statut_liste_avant == ListeEmbauche.STATUT_SOUMISE:
            try:
                from apps.embauche.embauche_sms import (
                    notifier_debut_file_si_transition_soumise_en_traitement,
                )

                notifier_debut_file_si_transition_soumise_en_traitement(
                    liste, statut_liste_avant
                )
            except Exception:
                logger.exception(
                    'SMS embauche : échec notifier_debut_file (présence) liste %s',
                    liste.reference,
                )
        return Response(
            {
                'status': 'Presence mise a jour',
                'presence': candidat.presence,
                'liste_statut': liste.statut,
            }
        )

    @action(detail=True, methods=['post'], url_path='notifier-jour-j')
    def notifier_jour_j(self, request, pk=None):
        """Renvoi manuel d'un SMS jour J (file) pour un candidat."""
        candidat = self.get_object()
        site = get_site_utilisateur(request.user)
        if site is not None:
            if not filter_queryset_by_user_site(
                CandidatEmbauche.objects.filter(pk=candidat.pk), request.user
            ).exists():
                return Response(
                    {'sent': False, 'detail': 'Candidat hors du périmètre de votre site.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
        from apps.embauche.embauche_sms import notifier_jour_j_candidat_embauche_manuel

        payload = notifier_jour_j_candidat_embauche_manuel(candidat)
        http_status = status.HTTP_200_OK if payload['sent'] else status.HTTP_400_BAD_REQUEST
        return Response(payload, status=http_status)

    @action(detail=True, methods=['patch'])
    def rattacher_fiche(self, request, pk=None):
        candidat = self.get_object()

        if candidat.liste.statut == ListeEmbauche.STATUT_CLOTUREE:
            return Response(
                {'error': 'Impossible de rattacher une fiche sur une liste CLOTUREE'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        fiche_id = request.data.get('fiche_aptitude')
        if not fiche_id:
            return Response(
                {'error': 'Le champ fiche_aptitude est requis'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            fiche = FicheAptitude.objects.select_related('collaborateur').get(pk=fiche_id)
        except FicheAptitude.DoesNotExist:
            return Response({'error': 'FicheAptitude introuvable'}, status=status.HTTP_404_NOT_FOUND)

        medecin = get_request_medecin(request)
        if medecin and fiche.site_id != medecin.site_id:
            return Response(
                {'error': 'La fiche aptitude est hors du périmètre du site.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if medecin and candidat.liste.medecin_id and candidat.liste.medecin.site_id != medecin.site_id:
            return Response(
                {'error': 'Le candidat est hors du périmètre du site.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Vérification de cohérence : si la fiche a un collaborateur, vérifier le matricule
        collab = fiche.collaborateur
        if collab:
            fiche_mat  = (collab.matricule or '').strip()
            cand_mat   = (candidat.matricule or '').strip()
            same_nom = (getattr(collab, 'nom', '') or '').lower() == (candidat.nom or '').lower()
            same_prenom = (getattr(collab, 'prenom', '') or '').lower() == (candidat.prenom or '').lower()
            is_match = (fiche_mat == cand_mat) if fiche_mat else (same_nom and same_prenom)
            if not is_match:
                return Response(
                    {'error': 'La fiche aptitude ne correspond pas au candidat'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        prev_fiche_id = candidat.fiche_aptitude_id
        candidat.fiche_aptitude = fiche
        candidat.save()

        if prev_fiche_id is None:
            try:
                from apps.embauche.embauche_sms import notifier_n_plus_2_apres_fiche_embauche

                notifier_n_plus_2_apres_fiche_embauche(candidat)
            except Exception:
                logger.exception(
                    'SMS embauche N+2 après fiche (rattacher_fiche candidat=%s)', candidat.pk
                )

        # Le rattachement fiche -> candidat est le bon moment pour pousser les champs med_* vers im_db.
        if fiche.type_visite == 'EMBAUCHE':
            try:
                update_med_fields_in_im(
                    candidat.matricule,
                    med_visite_embauche_effectuee=True,
                    med_date_visite_embauche=fiche.date_visite,
                    med_resultat_aptitude=fiche.aptitude,
                    med_date_resultat_aptitude=timezone.localdate(),
                )
            except Exception as e:
                logger.warning(
                    "[embauche] Echec sync im_db apres rattachement fiche, matricule=%s: %s",
                    candidat.matricule,
                    e,
                )

        return Response({
            'status': 'Fiche rattachee',
            'fiche_aptitude': candidat.fiche_aptitude_id,
            'etat_embauche': candidat.etat_embauche,
        })

    @action(detail=True, methods=['patch'])
    def observations(self, request, pk=None):
        candidat = self.get_object()
        serializer = self.get_serializer(candidat, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'status': 'Observations medecin mises a jour'})

    @action(detail=True, methods=['patch'])
    def changer_statut_integration(self, request, pk=None):
        candidat = self.get_object()
        next_status = request.data.get('statut_integration')
        allowed = {c[0] for c in CandidatEmbauche.STATUT_INTEGRATION_CHOICES}
        if next_status not in allowed:
            return Response({'error': 'statut_integration invalide'}, status=status.HTTP_400_BAD_REQUEST)

        transitions = {
            CandidatEmbauche.STATUT_INTEGRATION_EN_ATTENTE_VISITE: {
                CandidatEmbauche.STATUT_INTEGRATION_INTEGRE,
                CandidatEmbauche.STATUT_INTEGRATION_NON_RETENU,
            },
            CandidatEmbauche.STATUT_INTEGRATION_EN_FORMATION: {
                CandidatEmbauche.STATUT_INTEGRATION_INTEGRE,
                CandidatEmbauche.STATUT_INTEGRATION_NON_RETENU,
            },
            CandidatEmbauche.STATUT_INTEGRATION_INTEGRE: set(),
            CandidatEmbauche.STATUT_INTEGRATION_NON_RETENU: set(),
        }
        current = candidat.statut_integration
        if next_status == current:
            return Response({'status': 'Aucun changement', 'statut_integration': current})
        if next_status not in transitions.get(current, set()):
            return Response(
                {'error': f'Transition interdite: {current} -> {next_status}'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        candidat.statut_integration = next_status
        candidat.save(update_fields=['statut_integration'])
        return Response({
            'status': 'Statut integration mis a jour',
            'statut_integration': candidat.statut_integration,
        })

    @action(detail=True, methods=['post'])
    def creer_collaborateur(self, request, pk=None):
        """
        Crée un Collaborateur dans medical_db à partir de im_db (fallback candidat).

        Prérequis :
          - candidat.presence == PRESENT
          - candidat.etat_embauche == APTE (dérivé de la fiche aptitude)

              Après la création :
          - La FicheAptitude est mise à jour avec le collaborateur créé
          - Le DossierMédical (matricule_ref = matricule) est rattaché au collaborateur
                - Le statut_integration passe à INTEGRE
        """
        candidat = self.get_object()

        if candidat.liste.statut != ListeEmbauche.STATUT_CLOTUREE:
            return Response(
                {'error': 'La liste doit etre CLOTUREE avant de creer un collaborateur.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if candidat.presence != CandidatEmbauche.PRESENCE_PRESENT:
            return Response(
                {'error': 'Le candidat doit être PRESENT pour créer un collaborateur.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if candidat.etat_embauche != CandidatEmbauche.ETAT_APTE:
            return Response(
                {'error': 'Le candidat doit être APTE pour créer un collaborateur.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        im_site_persist = get_im_site_code_for_persist(request)
        im_site_filter = get_im_site_filter_from_request(request)

        if candidat.collaborateur_id:
            im_created = False
            im_synced = False
            im_action = None
            im_error = None
            im_warning = None
            med_sync_ok = False
            med_sync_fields = []
            med_sync_error = None
            try:
                im_defaults = {
                    'name': (candidat.nom or '').strip(),
                    'firstname': (candidat.prenom or '').strip(),
                    'CIN': (candidat.cin or '').strip(),
                    'date_naissance': candidat.date_naissance if candidat.date_naissance else None,
                    'sex': (candidat.genre or '').strip().lower(),
                    'telephone': (candidat.telephone or '').strip(),
                    'adr_gouv': (candidat.gouvernorat or '').strip(),
                    'fonction': (candidat.poste or '').strip(),
                    'department': _im_int_or_none(candidat.department),
                    'site': im_site_persist,
                }
                logger.info(
                    "[embauche] Upsert im_db.resource (already collab) start matricule=%s defaults=%s",
                    candidat.matricule,
                    im_defaults,
                )
                try:
                    _, im_created = ResourceIM.objects.using('im_db').update_or_create(
                        matricule=int(str(candidat.matricule).strip()),
                        defaults=im_defaults,
                    )
                except IntegrityError as e:
                    # Cas fréquent: CIN unique déjà pris dans im_db -> ne pas bloquer le flux RH
                    if "uk_CIN" in str(e):
                        im_warning = (
                            "CIN déjà existant dans im_db.resource, synchronisation faite sans CIN."
                        )
                        logger.warning(
                            "[embauche] Duplicate CIN on im_db upsert matricule=%s, retry without CIN: %s",
                            candidat.matricule,
                            e,
                        )
                        im_defaults["CIN"] = ""
                        _, im_created = ResourceIM.objects.using('im_db').update_or_create(
                            matricule=int(str(candidat.matricule).strip()),
                            defaults=im_defaults,
                        )
                    else:
                        raise
                im_synced = True
                im_action = 'created' if im_created else 'updated'
                logger.info(
                    "[embauche] Upsert im_db.resource (already collab) success matricule=%s created=%s",
                    candidat.matricule,
                    im_created,
                )

                # Toujours pousser les champs med_* aussi.
                med_payload = _build_med_sync_payload(
                    candidat,
                    getattr(request.user, 'username', ''),
                )
                med_sync_fields = list(med_payload.keys())
                logger.info(
                    "[embauche] med_* sync (already collab) start matricule=%s payload=%s",
                    candidat.matricule,
                    med_payload,
                )
                med_sync_ok = update_med_fields_in_im(candidat.matricule, **med_payload)
                logger.info(
                    "[embauche] med_* sync (already collab) result matricule=%s ok=%s",
                    candidat.matricule,
                    med_sync_ok,
                )
                if not med_sync_ok:
                    med_sync_error = "update_med_fields_in_im returned False"
            except Exception as e:
                im_error = str(e)
                logger.exception(
                    "[embauche] Upsert im_db.resource (already collab) failed matricule=%s error=%s",
                    candidat.matricule,
                    im_error,
                    exc_info=True,
                )
            return Response({
                'ok': im_error is None,
                'status': 'Collaborateur déjà créé et synchronisation im_db exécutée',
                'collaborateur': candidat.collaborateur_id,
                'collaborateur_id': candidat.collaborateur_id,
                'matricule': candidat.matricule,
                'cree_dans_im_db': bool(im_synced),
                'im_action': im_action,
                'im_error': im_error,
                'im_warning': im_warning,
                'med_sync_ok': med_sync_ok,
                'med_sync_fields': med_sync_fields,
                'med_sync_error': med_sync_error,
            })

        # Cas : la fiche a déjà un collaborateur (ne devrait pas arriver en embauche normale
        # puisque la fiche est créée avec collaborateur=null, mais on gère quand même)
        if (candidat.fiche_aptitude_id
                and candidat.fiche_aptitude
                and candidat.fiche_aptitude.collaborateur_id):
            candidat.collaborateur = candidat.fiche_aptitude.collaborateur
            candidat.save(update_fields=['collaborateur'])
            collab = candidat.collaborateur
            # Rattacher le dossier s'il existe, avec vérification prioritaire par collaborateur.
            dossier = DossierMedical.objects.filter(collaborateur=collab).first()
            if not dossier:
                dossier = DossierMedical.objects.filter(
                    matricule_ref=candidat.matricule,
                    collaborateur__isnull=True
                ).first()
                if dossier:
                    dossier.collaborateur = collab
                    dossier.save(update_fields=['collaborateur'])
                else:
                    DossierMedical.objects.create(
                        collaborateur=collab,
                        nom=candidat.nom or 'Inconnu',
                        prenom=candidat.prenom or 'Inconnu',
                    )
            return Response({
                'status': 'Collaborateur existant rattaché',
                'collaborateur': candidat.collaborateur_id,
            }, status=status.HTTP_200_OK)

        # Cas normal embauche : créer le Collaborateur depuis les données du candidat
        if Collaborateur.objects.filter(matricule=candidat.matricule).exists():
            return Response(
                {'error': f"Un collaborateur avec le matricule {candidat.matricule} existe déjà."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        im_data = None
        try:
            im_data = get_data_from_im(candidat.matricule, user_site=im_site_filter)
        except Exception:
            im_data = None

        source = im_data or {}

        im_created = False
        im_synced = False
        im_action = None
        im_error = None
        im_warning = None
        med_sync_ok = False
        med_sync_fields = []
        med_sync_error = None

        try:
            with transaction.atomic():
                collab = Collaborateur.objects.create(
                    matricule=candidat.matricule,
                    numero_cnss=source.get('numero_cnss') or '',
                    date_naissance=source.get('date_naissance') or candidat.date_naissance,
                    sexe=source.get('sexe') or None,
                    date_embauche=source.get('date_embauche') or candidat.liste.date_visite,
                )

                # Rattacher le collaborateur au candidat
                candidat.collaborateur = collab
                candidat.statut_integration = CandidatEmbauche.STATUT_INTEGRATION_INTEGRE
                candidat.save(update_fields=['collaborateur', 'statut_integration'])

                # Log explicite avant upsert im_db.resource
                im_defaults = {
                    'name': (candidat.nom or '').strip(),
                    'firstname': (candidat.prenom or '').strip(),
                    'CIN': (candidat.cin or '').strip(),
                    'date_naissance': candidat.date_naissance if candidat.date_naissance else None,
                    'sex': (candidat.genre or '').strip().lower(),
                    'telephone': (candidat.telephone or '').strip(),
                    'adr_gouv': (candidat.gouvernorat or '').strip(),
                    'fonction': (candidat.poste or '').strip(),
                    'department': _im_int_or_none(candidat.department),
                    'site': im_site_persist,
                }
                logger.info(
                    "[embauche] Upsert im_db.resource start matricule=%s defaults=%s",
                    candidat.matricule,
                    im_defaults,
                )

                # Upsert explicite sur im_db
                try:
                    _, im_created = ResourceIM.objects.using('im_db').update_or_create(
                        matricule=int(str(candidat.matricule).strip()),
                        defaults=im_defaults,
                    )
                except IntegrityError as e:
                    if "uk_CIN" in str(e):
                        im_warning = (
                            "CIN déjà existant dans im_db.resource, synchronisation faite sans CIN."
                        )
                        logger.warning(
                            "[embauche] Duplicate CIN on im_db upsert matricule=%s, retry without CIN: %s",
                            candidat.matricule,
                            e,
                        )
                        im_defaults["CIN"] = ""
                        _, im_created = ResourceIM.objects.using('im_db').update_or_create(
                            matricule=int(str(candidat.matricule).strip()),
                            defaults=im_defaults,
                        )
                    else:
                        raise
                im_synced = True
                im_action = 'created' if im_created else 'updated'
                logger.info(
                    "[embauche] Upsert im_db.resource success matricule=%s created=%s",
                    candidat.matricule,
                    im_created,
                )

                med_payload = _build_med_sync_payload(
                    candidat,
                    getattr(request.user, 'username', ''),
                )
                med_sync_fields = list(med_payload.keys())
                med_sync_ok = update_med_fields_in_im(
                    candidat.matricule,
                    **med_payload,
                )
                logger.info(
                    "[embauche] med_* sync matricule=%s ok=%s payload=%s",
                    candidat.matricule,
                    med_sync_ok,
                    med_payload,
                )
                if not med_sync_ok:
                    med_sync_error = "update_med_fields_in_im returned False"

                # Rattacher aussi la FicheAptitude au collaborateur.
                if candidat.fiche_aptitude_id:
                    FicheAptitude.objects.filter(pk=candidat.fiche_aptitude_id).update(
                        collaborateur=collab
                    )

                # Rattacher le DossierMedical (créé par le médecin avec matricule_ref)
                dossier = DossierMedical.objects.filter(collaborateur=collab).first()
                if not dossier:
                    dossier = DossierMedical.objects.filter(
                        matricule_ref=candidat.matricule,
                        collaborateur__isnull=True,
                    ).first()
                if dossier:
                    dossier.collaborateur = collab
                    dossier.save(update_fields=['collaborateur'])
                else:
                    DossierMedical.objects.create(
                        collaborateur=collab,
                        nom=candidat.nom or 'Inconnu',
                        prenom=candidat.prenom or 'Inconnu',
                        matricule_ref=candidat.matricule,
                    )


        except Exception as e:
            im_error = str(e)
            logger.exception(
                "[embauche] creer_collaborateur failed matricule=%s error=%s",
                candidat.matricule,
                im_error,
                exc_info=True,
            )
            return Response(
                {
                    'ok': False,
                    'error': f'Echec création collaborateur / synchronisation im_db: {im_error}',
                    'detail': im_error,
                    'matricule': candidat.matricule,
                    'cree_dans_im_db': False,
                    'im_error': im_error,
                    'med_sync_ok': med_sync_ok,
                    'med_sync_fields': med_sync_fields,
                    'med_sync_error': med_sync_error,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({
            'ok': True,
            'status': 'Collaborateur créé avec succès',
            'collaborateur': collab.id,
            'collaborateur_id': collab.id,
            'matricule': collab.matricule,
            'source_donnees': 'im_db' if im_data else 'candidat_fallback',
            'cree_dans_im_db': bool(im_synced),
            'im_action': im_action,
            'im_error': im_error,
            'im_warning': im_warning,
            'med_sync_ok': med_sync_ok,
            'med_sync_fields': med_sync_fields,
            'med_sync_error': med_sync_error,
        }, status=status.HTTP_201_CREATED)

    @action(
        detail=False,
        methods=['post'],
        url_path=r'par-matricule/(?P<matricule>[^/.]+)/creer_collaborateur'
    )
    def creer_collaborateur_par_matricule(self, request, matricule=None):
        """
        POST /api/embauche/candidats/par-matricule/{matricule}/creer_collaborateur/
        Facilite RH/Infirmier: évite de chercher l'ID candidat.
        Prend le candidat le plus récent pour ce matricule.
        """
        matricule = str(matricule or '').strip()
        if not matricule:
            return Response(
                {'error': 'Matricule requis'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        candidat = (
            CandidatEmbauche.objects
            .filter(matricule=matricule)
            .order_by('-date_creation')
            .first()
        )
        if not candidat:
            return Response(
                {'error': f'Aucun candidat trouvé pour matricule {matricule}'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Réutilise la logique existante par ID.
        previous_pk = self.kwargs.get('pk')
        self.kwargs['pk'] = str(candidat.pk)
        try:
            return self.creer_collaborateur(request, pk=candidat.pk)
        finally:
            if previous_pk is None:
                self.kwargs.pop('pk', None)
            else:
                self.kwargs['pk'] = previous_pk

    @action(detail=False, methods=['get'])
    def recherche_im(self, request):
        matricule = request.query_params.get('matricule')
        if not matricule:
            return Response(
                {'error': 'Le paramètre matricule est requis'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if im_site_required_but_missing(request):
            return Response(
                {'error': "Votre compte n'est associé à aucun site"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            data = get_data_from_im(
                matricule,
                user_site=get_im_site_filter_from_request(request),
            )
        except Exception:
            data = None

        if data is None:
            return Response(
                {
                    'error': (
                        "Ce collaborateur n'appartient pas à votre site ou est introuvable"
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        warning = None
        if (data.get('med_statut_integration') or '').upper() == CandidatEmbauche.STATUT_INTEGRATION_INTEGRE:
            warning = 'Cette personne est déjà collaborateur (statut INTEGRE dans le système RH).'

        return Response({'data': data, 'warning': warning})

    @action(detail=True, methods=['post'])
    def sync_depuis_im(self, request, pk=None):
        """
        Synchronise le Collaborateur depuis im_db.

        Cette action est appelée après creer_collaborateur, une fois que le RH
        a confirmé que le matricule est bien enregistré dans im_db.

        im_db est la source de vérité RH : elle contient toutes les informations
        officielles du collaborateur (CNSS, date embauche officielle, etc.).
        """
        candidat = self.get_object()

        if not candidat.collaborateur_id:
            return Response(
                {'error': "Créez d'abord le collaborateur via l'action creer_collaborateur."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        data = get_data_from_im(
            candidat.matricule,
            user_site=get_im_site_filter_from_request(request),
        )
        if data is None:
            return Response(
                {
                    'error': (
                        f"Matricule {candidat.matricule} introuvable dans im_db pour votre site "
                        f"ou non enregistré dans le système RH."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        collab = candidat.collaborateur
        field_map = {
            'date_naissance': 'date_naissance',
            'sexe': 'sexe',
            'date_embauche': 'date_embauche',
            'numero_cnss': 'numero_cnss',
        }
        updated = []
        for src, dest in field_map.items():
            val = data.get(src)
            if val:
                setattr(collab, dest, val)
                updated.append(dest)
        collab.save()

        # Rattacher le dossier médical si ce n'est pas encore fait
        dossier_rattache = False
        dossier = DossierMedical.objects.filter(
            matricule_ref=candidat.matricule
        ).first()
        if dossier and not dossier.collaborateur_id:
            dossier.collaborateur = collab
            dossier.save(update_fields=['collaborateur'])
            dossier_rattache = True

        if candidat.statut_integration != CandidatEmbauche.STATUT_INTEGRATION_INTEGRE:
            candidat.statut_integration = CandidatEmbauche.STATUT_INTEGRATION_INTEGRE
            candidat.save(update_fields=['statut_integration'])

        return Response({
            'status': 'Synchronisation réussie depuis im_db',
            'matricule': candidat.matricule,
            'statut_integration': candidat.statut_integration,
            'champs_collaborateur_mis_a_jour': updated,
            'dossier_rattache': dossier_rattache,
        })

    @action(detail=False, methods=['get'], url_path='documents_medecin')
    def documents_medecin(self, request):
        liste_id = request.query_params.get('liste_id')
        if not liste_id:
            return Response(
                {'error': 'Le paramètre liste_id est requis'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            liste_id = int(liste_id)
        except (TypeError, ValueError):
            return Response(
                {'error': 'liste_id invalide'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        candidats = self.get_queryset().filter(liste_id=liste_id)
        serializer = CandidatEmbaucheSerializer(
            candidats,
            many=True,
            context={'im_resource_map': self._build_im_resource_map(candidats)},
        )

        result = []
        for cand_data, cand_obj in zip(serializer.data, candidats):
            fiche = cand_data.get('resultat_fiche_aptitude')
            demandes_examen = []
            demandes_bilan = []
            if cand_obj.fiche_aptitude_id:
                for examen in cand_obj.fiche_aptitude.demandes_examen.all():
                    demandes_examen.append(DemandeExamenSerializer(examen).data)
                for bilan in cand_obj.fiche_aptitude.demandes_bilan.all():
                    demandes_bilan.append(DemandeBilanSerializer(bilan).data)
            result.append(
                {
                    # Champs à la racine pour accès direct côté frontend (onglet Documents médecin)
                    'nom': cand_obj.nom,
                    'prenom': cand_obj.prenom,
                    'matricule': cand_obj.matricule,
                    'candidat': cand_data,
                    'fiche_aptitude': fiche,
                    'demandes_examen': demandes_examen,
                    'demandes_bilan': demandes_bilan,
                }
            )
        return Response({'results': result})