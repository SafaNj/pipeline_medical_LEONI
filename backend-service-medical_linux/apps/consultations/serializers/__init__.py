from .consultation_serializers import ConsultationSerializer
from .certificat_serializers import CertificatSerializer
from .certificat_aptitude_serializers import CertificatAptitudeGeneraleSerializer
from .certificat_exemption_serializers import CertificatExemptionSerializer
from .certificat_bonne_sante_serializers import CertificatBonneSanteSerializer
from .certificat_permis_serializers import CertificatPermisConduireSerializer
from .certificat_prenuptial_serializers import CertificatPrenuptialSerializer
from .ligne_ordonnance_serializers import LigneOrdonnanceSerializer
from .ordonnance_serializers import OrdonnanceSerializer

__all__ = [
    'ConsultationSerializer',
    'CertificatSerializer',
    'CertificatAptitudeGeneraleSerializer',
    'CertificatExemptionSerializer',
    'CertificatBonneSanteSerializer',
    'CertificatPermisConduireSerializer',
    'CertificatPrenuptialSerializer',
    'LigneOrdonnanceSerializer',
    'OrdonnanceSerializer',
]
