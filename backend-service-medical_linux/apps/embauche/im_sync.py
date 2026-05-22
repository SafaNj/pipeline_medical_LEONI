from datetime import datetime, date
import logging

from apps.employees.im_site_codes import normalize_im_site_code
from apps.employees.models import ResourceIM


logger = logging.getLogger(__name__)


ALLOWED_MED_FIELDS = {
    'med_visite_embauche_effectuee',
    'med_date_visite_embauche',
    'med_resultat_aptitude',
    'med_date_resultat_aptitude',
    'med_statut_integration',
    'med_date_integration',
    'med_validateur_integration',
}


def _normalize_matricule(matricule):
    if matricule is None:
        return None
    try:
        return int(str(matricule).strip())
    except (TypeError, ValueError):
        return None


def _parse_date_im(value):
    """
    Parse une valeur de date depuis im_db.
    Supporte plusieurs formats : dd/mm/yyyy, yyyy-mm-dd, mm/dd/yyyy,
    ainsi que les objets date/datetime Python natifs.
    """
    if not value:
        return None

    # Si c'est déjà un objet date ou datetime Python natif
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value

    # Essayer plusieurs formats texte
    s = str(value).strip()
    for fmt in ('%d/%m/%Y', '%Y-%m-%d', '%m/%d/%Y', '%d-%m-%Y'):
        try:
            return datetime.strptime(s, fmt).date()
        except (TypeError, ValueError):
            pass

    return None


def get_data_from_im(matricule, user_site=None):
    """
    user_site :
      None — pas de filtre site (ex. superuser).
      str — matricule doit être sur cette valeur de resource.site.
      False — aucune donnée renvoyée (utilisateur sans périmètre IM).
    """
    if user_site is False:
        return None

    normalized_matricule = _normalize_matricule(matricule)
    if normalized_matricule is None:
        return None

    qs = ResourceIM.objects.using('im_db').filter(matricule=normalized_matricule)
    if user_site:
        qs = qs.filter(site=user_site)
    resource = qs.first()
    if not resource:
        return None

    sex_raw = (resource.sex or '').strip().lower()
    sexe = ''
    if sex_raw in ('homme', 'm', 'male', 'masculin'):
        sexe = 'M'
    elif sex_raw in ('femme', 'f', 'female', 'feminin', 'féminin'):
        sexe = 'F'

    # Helper : formater une date en YYYY-MM-DD pour input type=date HTML
    def _fmt_date_html(val):
        if not val:
            return ''
        # Objet date/datetime Python natif (depuis champ DateField Django)
        if isinstance(val, (datetime, date)):
            return val.strftime('%Y-%m-%d') if isinstance(val, datetime) else str(val)
        parsed = _parse_date_im(val)
        return str(parsed) if parsed else ''

    # ccenter peut être un entier dans im_db → forcer str
    centre_cout = resource.ccenter
    if centre_cout is not None:
        centre_cout = str(centre_cout)
    else:
        centre_cout = ''

    # department peut être un entier dans im_db → forcer str
    department = resource.department
    if department is not None:
        department = str(department)
    else:
        department = ''

    # niveau peut être un entier dans im_db → forcer str
    niveau = resource.niveau
    if niveau is not None:
        niveau = str(niveau)
    else:
        niveau = ''

    return {
        'matricule': resource.matricule,
        'nom': resource.name or '',
        'prenom': resource.firstname or '',
        'cin': resource.CIN or '',
        # date_naissance: YYYY-MM-DD pour input type=date dans le formulaire
        'date_naissance': _fmt_date_html(resource.date_naissance),
        'telephone': resource.telephone or '',
        'email': resource.mail or '',
        'sexe': sexe,
        'genre': sexe,  # alias utilisé côté frontend
        # Gouvernorat depuis adr_gouv (champ de résidence actuel)
        'gouvernorat': resource.adr_gouv or resource.adr_ville or '',
        'gouvernerat': resource.adr_gouv or resource.adr_ville or '',
        # Fonction / Poste depuis le champ "fonction" de la table resource
        'poste': resource.fonction or '',
        'fonction': resource.fonction or '',
        # Centre de coût depuis le champ "ccenter"
        'centre_cout': centre_cout,
        'plant_section': centre_cout,
        # Département
        'department': department,
        # Niveau d'études / classification
        'niveau': niveau,
        # Projet / Affectation depuis le champ "affectation"
        'projet': resource.affectation or '',
        'segment': department,
        # Formation / Qualification depuis le champ "Qualification"
        'formation': resource.Qualification or resource.specialite or '',
        'lieu_naissance': resource.lieu_naissance or '',
        'adresse': resource.adress or '',
        'date_embauche': _fmt_date_html(resource.date_embauche),
        'date_recrutement': _fmt_date_html(resource.date_embauche),  # alias
        'numero_cnss': resource.CNSS or '',
        'cnss': resource.CNSS or '',  # alias frontend / PDF
        'source_information': '',  # non disponible dans im_db
        'status_actif': resource.status_actif or '',
        'med_statut_integration': resource.med_statut_integration or '',
    }


def update_med_fields_in_im(matricule, **kwargs):
    normalized_matricule = _normalize_matricule(matricule)
    if normalized_matricule is None:
        return False

    resource = ResourceIM.objects.using('im_db').filter(matricule=normalized_matricule).first()
    if not resource:
        return False

    updated_fields = []
    for field_name, value in kwargs.items():
        if not field_name.startswith('med_'):
            continue
        if field_name not in ALLOWED_MED_FIELDS:
            continue
        setattr(resource, field_name, value)
        updated_fields.append(field_name)

    if updated_fields:
        try:
            resource.save(using='im_db', update_fields=updated_fields)
            return True
        except Exception as e:
            logger.error(f"[im_sync] Erreur save im_db matricule={matricule}: {e}")
            return False

    return True


def update_cnss_in_im(matricule, cnss_value):
    """
    Écrit CandidatEmbauche.numero_cnss côté RH dans im_db.resource.CNSS.
    (Les champs med_* passent par update_med_fields_in_im.)
    """
    normalized_matricule = _normalize_matricule(matricule)
    if normalized_matricule is None:
        return False

    resource = ResourceIM.objects.using('im_db').filter(matricule=normalized_matricule).first()
    if not resource:
        return False

    val = (cnss_value or '').strip() if cnss_value is not None else ''
    resource.CNSS = val
    try:
        resource.save(using='im_db', update_fields=['CNSS'])
        return True
    except Exception as e:
        logger.error('[im_sync] Erreur update CNSS im_db matricule=%s: %s', matricule, e)
        return False


def _date_to_im_str(value):
    if not value:
        return ''
    if hasattr(value, "strftime"):
        return value.strftime("%d/%m/%Y")
    try:
        parsed = datetime.strptime(str(value).strip(), "%Y-%m-%d")
        return parsed.strftime("%d/%m/%Y")
    except Exception:
        return str(value).strip()


def upsert_resource_in_im(
    matricule,
    nom='',
    prenom='',
    cin='',
    date_naissance=None,
    genre='',
    telephone='',
    gouvernorat='',
    poste='',
    department='',
    site='',
):
    """
    Crée/met à jour la ligne resource dans im_db pour assurer la persistance RH.
    Retourne True si écrit, False sinon.
    """
    normalized_matricule = _normalize_matricule(matricule)
    if normalized_matricule is None:
        return False

    sex = ''
    genre_norm = (genre or '').strip().lower()
    if genre_norm in ('homme', 'h', 'm', 'masculin'):
        sex = 'homme'
    elif genre_norm in ('femme', 'f', 'féminin', 'feminin'):
        sex = 'femme'

    defaults = {
        'name': (nom or '').strip(),
        'firstname': (prenom or '').strip(),
        'CIN': (cin or '').strip(),
        'date_naissance': _date_to_im_str(date_naissance),
        'sex': sex,
        'telephone': (telephone or '').strip(),
        'adr_gouv': (gouvernorat or '').strip(),
        'fonction': (poste or '').strip(),
        'department': (department or '').strip(),
        'site': normalize_im_site_code(site),
    }

    try:
        resource, created = ResourceIM.objects.using('im_db').get_or_create(
            matricule=normalized_matricule,
            defaults=defaults,
        )
        if not created:
            updated_fields = []
            for field_name, field_value in defaults.items():
                if field_value and getattr(resource, field_name, None) != field_value:
                    setattr(resource, field_name, field_value)
                    updated_fields.append(field_name)
            if updated_fields:
                resource.save(using='im_db', update_fields=updated_fields)
        return True
    except Exception as e:
        logger.error("[im_sync] Erreur upsert im_db matricule=%s: %s", matricule, e)
        return False