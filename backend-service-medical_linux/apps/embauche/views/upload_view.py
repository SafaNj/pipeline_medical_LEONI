from datetime import date

import pandas as pd
from django.db import transaction
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.account.models import Profile
from apps.account.permissions import MustChangePasswordPermission
from apps.account.utils import filter_queryset_by_user_site, get_im_site_filter_from_request
from apps.embauche.models import CandidatEmbauche, ListeEmbauche
from apps.embauche.permissions import IsRH
from apps.embauche.im_sync import get_data_from_im


def _clean_text(value):
    if pd.isna(value):
        return ''
    return str(value).strip()


def _clean_date(value):
    if pd.isna(value):
        return None
    dt = pd.to_datetime(value, errors='coerce')
    if pd.isna(dt):
        return None
    return dt.date()


def _split_nom_prenom(full_name):
    text = _clean_text(full_name)
    if not text:
        return '', ''

    parts = [p for p in text.split() if p]
    if not parts:
        return '', ''

    nom_parts = []
    split_index = None
    for idx, part in enumerate(parts):
        if part.isupper():
            nom_parts.append(part)
            continue
        split_index = idx
        break

    if split_index is None:
        prenom_parts = parts[len(nom_parts):]
    else:
        prenom_parts = parts[split_index:]

    if not nom_parts:
        nom_parts = [parts[0]]
        prenom_parts = parts[1:]

    nom = ' '.join(nom_parts).strip()
    prenom = ' '.join(prenom_parts).strip()

    return nom, prenom


def _normalize_row(row):
    nom = _clean_text(row.get('nom'))
    prenom = _clean_text(row.get('prenom'))

    collaborateur = _clean_text(row.get('collaborateur'))
    if collaborateur:
        nom_from_collab, prenom_from_collab = _split_nom_prenom(collaborateur)
        nom = nom_from_collab or nom
        prenom = prenom_from_collab or prenom

    genre = _clean_text(row.get('genre')).lower()

    return {
        'matricule': _clean_text(row.get('matricule')),
        'nom': nom,
        'prenom': prenom,
        'cin': _clean_text(row.get('cin')),
        'date_naissance': _clean_date(row.get('date_naissance')),
        'genre': genre,
        'telephone': _clean_text(row.get('telephone')),
        'gouvernorat': _clean_text(row.get('gouvernorat')),
        'niveau': _clean_text(row.get('niveau')),
        'num_demande': _clean_text(row.get('num_demande')),
        'ps': _clean_text(row.get('ps')),
        'projet': _clean_text(row.get('projet')),
        'date_recrutement': _clean_date(row.get('date_recrutement')),
        'centre_cout': _clean_text(row.get('centre_cout')),
        'poste': _clean_text(row.get('poste')),
        'department': _clean_text(row.get('department')),
        'source_information': _clean_text(row.get('source_information')),
        'formation': _clean_text(row.get('formation')),
    }


def _extract_rows_from_excel(file_obj):
    sheets = pd.read_excel(file_obj, sheet_name=None)
    if not sheets:
        return None, [], [{'ligne': 0, 'erreur': 'Fichier Excel vide'}]

    first_sheet_name = list(sheets.keys())[0]
    df = sheets[first_sheet_name]
    df = df.dropna(how='all')

    normalized_columns = {
        str(col).strip().lower(): col for col in df.columns
    }

    mapping = {
        'collaborateur': ['collaborateur'],
        'matricule': ['matricule', 'mat', 'mle'],
        'cin': ['cin'],
        'date_naissance': ['date naissance', 'date_naissance', 'date de naissance'],
        'genre': ['genre', 'sexe'],
        'telephone': ['telephone', 'téléphone', 'tel'],
        'gouvernorat': ['gouvernorat'],
        'niveau': ['niveau'],
        'num_demande': ['num demande', 'num_demande', 'numéro demande'],
        'ps': ['ps'],
        'projet': ['projet'],
        'date_recrutement': ['date recruttment', 'date recrutement', 'date_recrutement'],
        'centre_cout': ['centre de cout', 'centre_cout', 'centre de coût'],
        'poste': ['fonction', 'poste'],
        'department': ['department', 'departement', 'département', 'service'],
        'source_information': ["source d'information", 'source information', 'source_information'],
        'formation': ['formation'],
        'nom': ['nom'],
        'prenom': ['prenom', 'prénom'],
    }

    resolved = {}
    for field, aliases in mapping.items():
        for alias in aliases:
            if alias in normalized_columns:
                resolved[field] = normalized_columns[alias]
                break

    if 'matricule' not in resolved:
        return first_sheet_name, [], [
            {'ligne': 0, 'erreur': 'Colonnes obligatoires manquantes: matricule'}
        ]

    has_collaborateur = 'collaborateur' in resolved
    has_nom_prenom = 'nom' in resolved and 'prenom' in resolved
    if not has_collaborateur and not has_nom_prenom:
        return first_sheet_name, [], [
            {'ligne': 0, 'erreur': 'Colonnes obligatoires manquantes: collaborateur ou nom+prenom'}
        ]

    apercu = []
    erreurs = []
    for idx, (_, source_row) in enumerate(df.iterrows(), start=2):
        row_data = {}
        for field, column_name in resolved.items():
            row_data[field] = source_row.get(column_name)

        cleaned = _normalize_row(row_data)
        row_errors = []
        if not cleaned['matricule']:
            row_errors.append('Matricule vide')
        if not cleaned['nom']:
            row_errors.append('Nom vide')
        if not cleaned['prenom']:
            row_errors.append('Prenom vide')

        if row_errors:
            erreurs.append({'ligne': idx, 'erreur': '; '.join(row_errors)})
            continue

        cleaned['ligne_source'] = idx
        apercu.append(cleaned)

    return first_sheet_name, apercu, erreurs


class UploadExcelPreviewView(APIView):
    permission_classes = [MustChangePasswordPermission, IsAuthenticated, IsRH]

    @transaction.atomic
    def post(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'Fichier Excel requis dans le champ file'}, status=status.HTTP_400_BAD_REQUEST)

        profile = Profile.objects.filter(user=request.user).first()
        if not profile:
            return Response({'error': 'Profil introuvable pour cet utilisateur'}, status=status.HTTP_400_BAD_REQUEST)

        sheet_name, apercu, erreurs = _extract_rows_from_excel(file_obj)
        date_visite = _clean_date(sheet_name) if sheet_name else None
        if not date_visite:
            date_visite = date.today()

        liste = ListeEmbauche.objects.create(
            date_visite=date_visite,
            cree_par=profile,
            statut=ListeEmbauche.STATUT_BROUILLON,
            fichier_excel=file_obj,
        )

        return Response({
            'liste_id': liste.id,
            'sheet_name': sheet_name,
            'date_visite': date_visite,
            'apercu': apercu,
            'erreurs': erreurs,
            'fichier_original': file_obj.name,
            'statut': liste.statut,
        })


class UploadExcelConfirmView(APIView):
    permission_classes = [MustChangePasswordPermission, IsAuthenticated, IsRH]

    @transaction.atomic
    def post(self, request):
        liste_id = request.data.get('liste_id')
        if not liste_id:
            return Response({'error': 'Le champ liste_id est requis'}, status=status.HTTP_400_BAD_REQUEST)

        liste = filter_queryset_by_user_site(ListeEmbauche.objects.all(), request.user).filter(pk=liste_id).first()
        if not liste:
            return Response({'error': 'Liste embauche introuvable'}, status=status.HTTP_404_NOT_FOUND)

        candidats = request.data.get('apercu') or []
        if not isinstance(candidats, list) or not candidats:
            return Response({'error': 'Le champ apercu doit contenir une liste non vide'}, status=status.HTTP_400_BAD_REQUEST)

        if liste.candidats.exists():
            liste.candidats.all().delete()

        to_create = []
        for item in candidats:
            matricule = str(item.get('matricule') or '').strip()
            nom       = str(item.get('nom') or '').strip()
            prenom    = str(item.get('prenom') or '').strip()

            # Si nom ou prénom manquants dans l'Excel, tenter de les récupérer depuis im_db
            if matricule and (not nom or not prenom):
                try:
                    im_data = (
                        get_data_from_im(
                            matricule,
                            user_site=get_im_site_filter_from_request(request),
                        )
                        or {}
                    )
                    nom    = nom    or im_data.get('nom', '')
                    prenom = prenom or im_data.get('prenom', '')
                except Exception:
                    pass  # im_db indisponible → on garde les champs vides

            to_create.append(
                CandidatEmbauche(
                    liste=liste,
                    ligne_source=item.get('ligne_source') or 0,
                    matricule=matricule,
                    nom=nom,
                    prenom=prenom,
                    cin=str(item.get('cin') or '').strip(),
                    numero_cnss=str(
                        item.get('numero_cnss') or item.get('cnss') or ''
                    ).strip(),
                    date_naissance=_clean_date(item.get('date_naissance')),
                    genre=str(item.get('genre') or '').strip(),
                    gouvernorat=str(item.get('gouvernorat') or '').strip(),
                    niveau=str(item.get('niveau') or '').strip(),
                    num_demande=str(item.get('num_demande') or '').strip(),
                    ps=str(item.get('ps') or '').strip(),
                    projet=str(item.get('projet') or '').strip(),
                    date_recrutement=_clean_date(item.get('date_recrutement')),
                    centre_cout=str(item.get('centre_cout') or '').strip(),
                    poste=str(item.get('poste') or '').strip(),
                    department=str(item.get('department') or '').strip(),
                    source_information=str(item.get('source_information') or '').strip(),
                    formation=str(item.get('formation') or '').strip(),
                    telephone=str(item.get('telephone') or '').strip(),
                )
            )

        CandidatEmbauche.objects.bulk_create(to_create)

        return Response(
            {
                'liste_id': liste.id,
                'reference': liste.reference,
                'date_visite': liste.date_visite,
                'statut': liste.statut,
                'nombre_candidats': len(to_create),
            },
            status=status.HTTP_201_CREATED,
        )