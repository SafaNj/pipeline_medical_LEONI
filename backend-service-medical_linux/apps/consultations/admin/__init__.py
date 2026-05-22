from .consultation_admin import ConsultationAdmin
from .ordonnance_admin import OrdonnanceAdmin
from .ligne_ordonnance_admin import LigneOrdonnanceAdmin
from .certificat_admin import CertificatAdmin
from .certificat_aptitude_admin import CertificatAptitudeGeneraleAdmin
from .certificat_exemption_admin import CertificatExemptionAdmin
from .certificat_bonne_sante_admin import CertificatBonneSanteAdmin
from .certificat_permis_admin import CertificatPermisConduireAdmin
from .certificat_prenuptial_admin import CertificatPrenuptialAdmin
from .posologie_admin import PosologieStandardAdmin

__all__ = [
    'ConsultationAdmin',
    'OrdonnanceAdmin',
    'LigneOrdonnanceAdmin',
    'CertificatAdmin',
    'CertificatAptitudeGeneraleAdmin',
    'CertificatExemptionAdmin',
    'CertificatBonneSanteAdmin',
    'CertificatPermisConduireAdmin',
    'CertificatPrenuptialAdmin',
    'PosologieStandardAdmin',
]