from .absence_medecin_viewsets import AbsenceMedecinViewSet
from .accident_travail_viewsets import AccidentTravailViewSet
from .declaration_cnam_viewsets import DeclarationCNAMViewSet
from .document_medical_scanne_viewsets import DocumentMedicalScanneViewSet
from .incident_avec_bon_viewsets import IncidentAvecBonViewSet
from .incident_sans_bon_viewsets import IncidentSansBonViewSet
from .listpassage_viewsets import InfirmierListeViewSet
from .itempassage_viewsets import ItemPassageViewSet
from .maladie_chronique_viewsets import MaladieChroniquViewSet
from .maladie_professionnelle_viewsets import MaladieProfessionnelleViewSet
from .ordre_transport_viewsets import OrdreTransportViewSet
from .pointage_medecin_viewsets import PointageMedecinViewSet
from .rdv_psychologue_viewsets import RendezVousPsychologueViewSet
from .rdv_sagefemme_viewsets import RendezVousSagefemmeViewSet
from .transfert_urgence_viewsets import TransfertUrgenceViewSet

__all__ = [
    "AbsenceMedecinViewSet",
    "AccidentTravailViewSet",
    "DeclarationCNAMViewSet",
    "DocumentMedicalScanneViewSet",
    "IncidentAvecBonViewSet",
    "IncidentSansBonViewSet",
    "InfirmierListeViewSet",
    "ItemPassageViewSet",
    "MaladieChroniquViewSet",
    "MaladieProfessionnelleViewSet",
    "OrdreTransportViewSet",
    "PointageMedecinViewSet",
    "RendezVousPsychologueViewSet",
    "RendezVousSagefemmeViewSet",
    "TransfertUrgenceViewSet",
]
