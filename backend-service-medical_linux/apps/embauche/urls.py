from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.embauche.views import CandidatEmbaucheViewSet, ListeEmbaucheViewSet
from apps.embauche.views.upload_view import UploadExcelConfirmView, UploadExcelPreviewView

router = DefaultRouter()
router.register(r'listes', ListeEmbaucheViewSet, basename='embauche-listes')
router.register(r'candidats', CandidatEmbaucheViewSet, basename='embauche-candidats')

urlpatterns = [
    path('listes/upload/', UploadExcelPreviewView.as_view(), name='embauche-upload'),
    path('listes/upload/confirmer/', UploadExcelConfirmView.as_view(), name='embauche-upload-confirmer'),
    path('', include(router.urls)),
]
