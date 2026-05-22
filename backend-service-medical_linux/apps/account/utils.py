from django.core.exceptions import FieldDoesNotExist
from django.core.exceptions import FieldError
from django.db.models import Q

from apps.account.models import Profile
from apps.employees.im_site_codes import normalize_im_site_code


SITE_FILTER_LOOKUPS = (
    "site",
    "accident__site",
    "enquete__accident__site",
    "infirmiere__profile__infirmier__site",
    "depose_par__profile__infirmier__site",
    "medicament__site",
    "stock__site",
    "item_passage__liste__site",
    "item_passage__liste__medecin__site",
    "item_passage__liste__cree_par__rh__site",
    "item_passage__liste__cree_par__infirmier__site",
    "liste__medecin__site",
    "liste__site",
    "liste__cree_par__rh__site",
    "liste__cree_par__infirmier__site",
    "cree_par__rh__site",
    "cree_par__infirmier__site",
    "medecin__site",
    "consultation__site",
    "ordonnance__consultation__site",
    "ordonnance__site",
    "fiche_aptitude__site",
    "contre_visite__site",
)


def get_site_utilisateur(user):
    if not user or not user.is_authenticated:
        return None

    if getattr(user, "is_superuser", False):
        return None

    profile = getattr(user, "profile", None)
    if not profile:
        return None

    role = (getattr(profile, "role", "") or "").strip().lower()
    role_to_relation = {
        "infirmier": "infirmier",
        "infirmiere": "infirmier",
        "rh": "rh",
        "hsee": "hsee",
        "hsse": "hsee",
        "medecin": "medecin",
    }
    relation_name = role_to_relation.get(role)
    if not relation_name:
        return None

    role_model = getattr(profile, relation_name, None)
    return getattr(role_model, "site", None)


def get_im_site_filter_from_request(request):
    """
    Filtrage lectures im_db.resource.site.

    - ``None`` : pas de filtre (superuser).
    - ``str`` : code IM canonique (MENZEL_HAYET / MASSADINE / MATEUR).
    - ``False`` : utilisateur authentifié sans périmètre IM valide → aucune ligne IM exposée.
    """
    if not getattr(request, "user", None) or not request.user.is_authenticated:
        return False
    if getattr(request.user, "is_superuser", False):
        return None
    site_obj = get_site_utilisateur(request.user)
    raw = (site_obj.code or "").strip() if site_obj else ""
    normalized = normalize_im_site_code(raw)
    if normalized:
        return normalized
    return False


def im_site_required_but_missing(request):
    """
    True si l’utilisateur (non superuser) ne peut pas être rattaché à un site IM valide :
    pas de profil site, code vide, ou code hors liste canonique.
    """
    if getattr(request.user, "is_superuser", False):
        return False
    site_obj = get_site_utilisateur(request.user)
    raw = (site_obj.code or "").strip() if site_obj else ""
    return normalize_im_site_code(raw) == ""


def get_im_site_code_for_persist(request):
    """Code IM canonique à écrire dans im_db.resource.site ; '' si superuser ou site invalide."""
    if getattr(request.user, "is_superuser", False):
        return ""
    site_obj = get_site_utilisateur(request.user)
    raw = (site_obj.code or "").strip() if site_obj else ""
    return normalize_im_site_code(raw)


def _filter_queryset_by_site(queryset, site):
    if site is None:
        return queryset

    def _resolve_lookup_field(model, lookup):
        current_model = model
        field = None
        parts = lookup.split("__")

        for index, part in enumerate(parts):
            field = current_model._meta.get_field(part)
            is_last = index == len(parts) - 1
            if is_last:
                return field

            if not getattr(field, "is_relation", False) or getattr(field, "related_model", None) is None:
                raise FieldError(f"Cannot traverse non-related field '{part}' in lookup '{lookup}'")

            current_model = field.related_model

        return field

    def _lookup_accepts_site_instance(model, lookup, site_instance):
        field = _resolve_lookup_field(model, lookup)
        remote_model = getattr(getattr(field, "remote_field", None), "model", None)
        if remote_model is None:
            return False
        return isinstance(site_instance, remote_model)

    applicable_lookups = []
    for lookup in SITE_FILTER_LOOKUPS:
        try:
            if not _lookup_accepts_site_instance(queryset.model, lookup, site):
                continue

            # Force SQL compilation to validate each lookup immediately.
            queryset.filter(**{lookup: site}).query.sql_with_params()
            applicable_lookups.append(lookup)
        except (FieldError, ValueError, TypeError, Exception):
            continue

    if not applicable_lookups:
        return queryset

    combined_query = Q()
    for lookup in applicable_lookups:
        combined_query |= Q(**{lookup: site})

    return queryset.filter(combined_query).distinct()


def filter_queryset_by_site(queryset, site):
    return _filter_queryset_by_site(queryset, site)


def filter_queryset_by_user_site(queryset, user):
    site = get_site_utilisateur(user)
    return _filter_queryset_by_site(queryset, site)


def get_site_save_kwargs_for_serializer(serializer, user):
    site = get_site_utilisateur(user)
    if site is None:
        return {}

    model = getattr(getattr(serializer, "Meta", None), "model", None)
    if model is None:
        return {}

    try:
        field = model._meta.get_field("site")
    except FieldDoesNotExist:
        return {}

    remote_model = getattr(getattr(field, "remote_field", None), "model", None)
    if remote_model is None:
        return {}

    return {"site": site}


class SiteScopedQuerysetCreateMixin:
    def get_queryset(self):
        queryset = super().get_queryset()
        return filter_queryset_by_user_site(queryset, self.request.user)

    def perform_create(self, serializer):
        kwargs = get_site_save_kwargs_for_serializer(serializer, self.request.user)
        serializer.save(**kwargs)
