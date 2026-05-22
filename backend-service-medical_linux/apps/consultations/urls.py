# apps/consultations/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.consultations.views import (
    CertificatAptitudeGeneraleViewSet,
    CertificatBonneSanteViewSet,
    CertificatExemptionViewSet,
    CertificatPermisConduireViewSet,
    CertificatPrenuptialViewSet,
    CertificatViewSet,
    ConsultationViewSet,
    LigneOrdonnanceViewSet,
    OrdonnanceViewSet,
)
from apps.consultations.views.posologie_viewsets import PosologieViewSet

router = DefaultRouter()

router.register(r'consultations', ConsultationViewSet,      basename='consultations')
router.register(r'ordonnances',   OrdonnanceViewSet,        basename='ordonnances')
router.register(r'lignes',        LigneOrdonnanceViewSet,   basename='lignes-ordonnance')
router.register(r'certificats',   CertificatViewSet,        basename='certificats')
router.register(r'certificats-aptitude-generale', CertificatAptitudeGeneraleViewSet, basename='certificats-aptitude-generale')
router.register(r'certificats-exemption', CertificatExemptionViewSet, basename='certificats-exemption')
router.register(r'certificats-bonne-sante', CertificatBonneSanteViewSet, basename='certificats-bonne-sante')
router.register(r'certificats-permis', CertificatPermisConduireViewSet, basename='certificats-permis')
router.register(r'certificats-prenuptial', CertificatPrenuptialViewSet, basename='certificats-prenuptial')
router.register(r'posologies',    PosologieViewSet,         basename='posologies')

urlpatterns = [
    path('', include(router.urls)),
]