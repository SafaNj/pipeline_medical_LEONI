from rest_framework.routers import DefaultRouter

from apps.act_infirmier.views import (
    AbsenceMedecinViewSet,
    AccidentTravailViewSet,
    DeclarationCNAMViewSet,
    DocumentMedicalScanneViewSet,
    IncidentAvecBonViewSet,
    IncidentSansBonViewSet,
    InfirmierListeViewSet,
    ItemPassageViewSet,
    MaladieChroniquViewSet,
    MaladieProfessionnelleViewSet,
    OrdreTransportViewSet,
    PointageMedecinViewSet,
    RendezVousPsychologueViewSet,
    RendezVousSagefemmeViewSet,
    TransfertUrgenceViewSet,
    
)

from django.urls import path
from apps.act_infirmier.views.export_pointage_view import ExportPointageMedecinView

router = DefaultRouter()
router.register(r'listes', InfirmierListeViewSet, basename='infirmier-liste')
router.register(r'items', ItemPassageViewSet, basename='act-infirmier-items')
router.register(r'item-passage', ItemPassageViewSet, basename='act-infirmier-items-legacy')
router.register(r'accidents', AccidentTravailViewSet, basename='accidents')
router.register(r'maladies-professionnelles', MaladieProfessionnelleViewSet, basename='maladies-professionnelles')
router.register(r'maladies-chroniques', MaladieChroniquViewSet, basename='maladies-chroniques')
router.register(r'rdv-psychologue', RendezVousPsychologueViewSet, basename='rdv-psychologue')
router.register(r'rdv-sagefemme', RendezVousSagefemmeViewSet, basename='rdv-sagefemme')
router.register(r'incidents-sans-bon', IncidentSansBonViewSet, basename='incidents-sans-bon')
router.register(r'incidents-avec-bon', IncidentAvecBonViewSet, basename='incidents-avec-bon')
router.register(r'transferts-urgence', TransfertUrgenceViewSet, basename='transferts-urgence')
router.register(r'declarations-cnam', DeclarationCNAMViewSet, basename='declarations-cnam')
router.register(
    r'documents-medicaux-scannes',
    DocumentMedicalScanneViewSet,
    basename='documents-medicaux-scannes',
)
router.register(r'pointages-medecins', PointageMedecinViewSet, basename='pointages-medecins')
router.register(r'absences-medecins', AbsenceMedecinViewSet, basename='absences-medecins')
router.register(r'ordres-transport', OrdreTransportViewSet, basename='ordre-transport')

urlpatterns = router.urls + [
    path('pointages-medecins/export/', ExportPointageMedecinView.as_view(), name='export-pointage-medecin'),
]
