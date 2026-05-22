# employees/serializers/employee_serializers.py
from rest_framework import serializers

from apps.account.utils import get_im_site_filter_from_request
from apps.embauche.im_sync import get_data_from_im
from apps.employees.models import Collaborateur


class CollaborateurSerializer(serializers.ModelSerializer):
    """
    Champs identité / contact issus d'im_db : toujours filtrés par le site
    de l'utilisateur de la requête (sauf superuser : lecture large).
    """

    cin = serializers.SerializerMethodField()
    lieu_naissance = serializers.SerializerMethodField()
    nom = serializers.SerializerMethodField()
    prenom = serializers.SerializerMethodField()
    adresse = serializers.SerializerMethodField()
    telephone = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    poste = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    plant_section = serializers.SerializerMethodField()
    segment = serializers.SerializerMethodField()

    class Meta:
        model = Collaborateur
        fields = [
            "id",
            "matricule",
            "cin",
            "numero_cnss",
            "date_naissance",
            "lieu_naissance",
            "sexe",
            "date_embauche",
            "nom",
            "prenom",
            "adresse",
            "telephone",
            "email",
            "poste",
            "department",
            "plant_section",
            "segment",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._scoped_im_cache = {}

    def _scoped_im(self, obj):
        pk = obj.pk
        if pk not in self._scoped_im_cache:
            request = self.context.get("request")
            scope = get_im_site_filter_from_request(request) if request else False
            if scope is False:
                self._scoped_im_cache[pk] = {}
            else:
                self._scoped_im_cache[pk] = get_data_from_im(obj.matricule, user_site=scope) or {}
        return self._scoped_im_cache[pk]

    def get_cin(self, obj):
        return self._scoped_im(obj).get("cin") or ""

    def get_lieu_naissance(self, obj):
        return self._scoped_im(obj).get("lieu_naissance") or ""

    def get_nom(self, obj):
        return self._scoped_im(obj).get("nom") or ""

    def get_prenom(self, obj):
        return self._scoped_im(obj).get("prenom") or ""

    def get_adresse(self, obj):
        return self._scoped_im(obj).get("adresse") or ""

    def get_telephone(self, obj):
        return self._scoped_im(obj).get("telephone") or ""

    def get_email(self, obj):
        return self._scoped_im(obj).get("email") or ""

    def get_poste(self, obj):
        im = self._scoped_im(obj)
        return im.get("poste") or im.get("fonction") or ""

    def get_department(self, obj):
        return self._scoped_im(obj).get("department") or ""

    def get_plant_section(self, obj):
        return self._scoped_im(obj).get("plant_section") or ""

    def get_segment(self, obj):
        return self._scoped_im(obj).get("segment") or ""

    def validate_matricule(self, value):
        """
        Le matricule doit contenir uniquement des chiffres
        et être unique.
        """
        if not value.isdigit():
            raise serializers.ValidationError(
                "Le matricule doit contenir uniquement des chiffres"
            )

        qs = Collaborateur.objects.filter(matricule=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Ce matricule existe déjà")

        return value
