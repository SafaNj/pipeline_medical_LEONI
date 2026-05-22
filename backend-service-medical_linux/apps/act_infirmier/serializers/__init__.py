from .absence_medecin_serializers import AbsenceMedecinSerializer
from .accident_travail_serializers import AccidentTravailSerializer
from .enquete_accident_serializers import EnqueteAccidentSerializer
from .declaration_cnam_serializers import DeclarationCNAMSerializer
from .document_medical_scanne_serializers import DocumentMedicalScanneSerializer
from .incident_avec_bon_serializers import IncidentAvecBonSerializer
from .incident_sans_bon_serializers import IncidentSansBonSerializer
from .maladie_chronique_serializers import MaladieChroniquSerializer
from .maladie_professionnelle_serializers import MaladieProfessionnelleSerializer
from .ordre_transport_serializer import OrdreTransportSerializer
from .pointage_medecin_serializers import PointageMedecinSerializer
from .rdv_psychologue_serializers import RendezVousPsychologueSerializer
from .rdv_sagefemme_serializers import RendezVousSagefemmeSerializer
from .transfert_urgence_serializers import TransfertUrgenceSerializer

__all__ = [
    "AbsenceMedecinSerializer",
    "AccidentTravailSerializer",
    "EnqueteAccidentSerializer",
    "DeclarationCNAMSerializer",
    "DocumentMedicalScanneSerializer",
    "IncidentAvecBonSerializer",
    "IncidentSansBonSerializer",
    "MaladieChroniquSerializer",
    "MaladieProfessionnelleSerializer",
    "OrdreTransportSerializer",
    "PointageMedecinSerializer",
    "RendezVousPsychologueSerializer",
    "RendezVousSagefemmeSerializer",
    "TransfertUrgenceSerializer",
]