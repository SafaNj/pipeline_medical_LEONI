# account/tokens.py
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.tokens import AccessToken

from apps.account.models import Profile
from apps.account.models.HSEE_models import HSEE
from apps.account.models.infirmier_models import Infirmier
from apps.account.models.medecin_models import Medecin
from apps.account.models.rh_models import RH


def build_french_display_name(user):
    """Return a trimmed French full name; fallback to username when empty."""
    first_name = (user.first_name or "").strip()
    last_name = (user.last_name or "").strip()
    full_name = f"{first_name} {last_name}".strip()
    return full_name or user.username


def build_auth_context(user):
    """Build the auth payload and JWT claims shared by login/change-password flows."""
    context = {
        "role": None,
        "must_change_password": False,
        "med_type": None,
        "nom_ar": None,
        "prenom_ar": None,
        "site_id": None,
        "site_nom": None,
        "site_template_key": None,
        "site_code": None,
    }

    try:
        profile = Profile.objects.get(user=user)
    except Profile.DoesNotExist:
        return context

    context["role"] = profile.role
    context["must_change_password"] = profile.must_change_password

    role = (profile.role or "").strip().lower()

    if role == "medecin":
        try:
            medecin = Medecin.objects.select_related("med_type", "site").get(profile=profile)
        except Medecin.DoesNotExist:
            return context

        context["med_type"] = medecin.med_type.name if medecin.med_type else None
        context["nom_ar"] = medecin.nom_ar or None
        context["prenom_ar"] = medecin.prenom_ar or None
        site = medecin.site
    elif role == "infirmier":
        try:
            infirmier = Infirmier.objects.select_related("site").get(profile=profile)
        except Infirmier.DoesNotExist:
            return context
        site = infirmier.site
    elif role == "rh":
        try:
            rh = RH.objects.select_related("site").get(profile=profile)
        except RH.DoesNotExist:
            return context
        site = rh.site
    elif role in ("hsse", "hsee"):
        try:
            hsee = HSEE.objects.select_related("site").get(profile=profile)
        except HSEE.DoesNotExist:
            return context
        site = hsee.site
    else:
        return context

    if site:
        context["site_id"] = site.id
        context["site_nom"] = site.nom
        context["site_template_key"] = site.template_key
        context["site_code"] = site.code

    return context


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Customized serializer to add additional fields to JWT token
    Adds: role, username, must_change_password
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        display_name = build_french_display_name(user)

        auth_context = build_auth_context(user)
        token['role'] = auth_context['role']
        token['must_change_password'] = auth_context['must_change_password']
        token['med_type'] = auth_context['med_type']
        token['nom_ar'] = auth_context['nom_ar']
        token['prenom_ar'] = auth_context['prenom_ar']
        token['site_id'] = auth_context['site_id']
        token['site_nom'] = auth_context['site_nom']
        token['site_template_key'] = auth_context['site_template_key']
        token['site_code'] = auth_context['site_code']

        token['username'] = display_name

        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        display_name = build_french_display_name(self.user)

        auth_context = build_auth_context(self.user)
        data.update(auth_context)

        data['username'] = display_name
        data['user_id'] = self.user.id

        return data


class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    """
    Extend refresh response with user/site context so frontend can refresh silently
    without losing identity/template information.
    """

    def validate(self, attrs):
        data = super().validate(attrs)

        access_raw = data.get('access')
        if not access_raw:
            return data

        user = None
        try:
            access = AccessToken(access_raw)
            user_id = access.get('user_id')
            if user_id is not None:
                user = get_user_model().objects.filter(pk=user_id).first()
        except Exception:
            user = None

        if not user:
            data.update(
                {
                    'role': None,
                    'must_change_password': False,
                    'med_type': None,
                    'nom_ar': None,
                    'prenom_ar': None,
                    'site_id': None,
                    'site_nom': None,
                    'site_template_key': None,
                    'site_code': None,
                    'username': None,
                    'user_id': None,
                }
            )
            return data

        auth_context = build_auth_context(user)
        display_name = build_french_display_name(user)
        data.update(auth_context)
        data['username'] = display_name
        data['user_id'] = user.id
        return data
