from .consultation_viewsets import ConsultationViewSet
from .certificat_viewsets import CertificatMedicalViewSet, CertificatViewSet
from .certificat_aptitude_viewsets import CertificatAptitudeGeneraleViewSet
from .certificat_exemption_viewsets import CertificatExemptionViewSet
from .certificat_bonne_sante_viewsets import CertificatBonneSanteViewSet
from .certificat_permis_viewsets import CertificatPermisConduireViewSet
from .certificat_prenuptial_viewsets import CertificatPrenuptialViewSet
from .ligne_ordonnance_viewsets import LigneOrdonnanceViewSet
from .ordonnance_viewsets import OrdonnanceViewSet

__all__ = [
    'ConsultationViewSet',
    'CertificatViewSet',
    'CertificatMedicalViewSet',
    'CertificatAptitudeGeneraleViewSet',
    'CertificatExemptionViewSet',
    'CertificatBonneSanteViewSet',
    'CertificatPermisConduireViewSet',
    'CertificatPrenuptialViewSet',
    'LigneOrdonnanceViewSet',
    'OrdonnanceViewSet',
]
