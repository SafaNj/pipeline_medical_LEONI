# apps/embauche/serializers/__init__.py
from .liste_serializers import ListeEmbaucheSerializer, ListeEmbaucheDetailSerializer
from .candidat_serializers import (
    CandidatEmbaucheSerializer,
    CandidatMedecinUpdateSerializer,
    CandidatUpdateSerializer,
    CandidatRHUpdateSerializer,   # ← nouveau
)

__all__ = [
    'ListeEmbaucheSerializer',
    'ListeEmbaucheDetailSerializer',
    'CandidatEmbaucheSerializer',
    'CandidatMedecinUpdateSerializer',
    'CandidatUpdateSerializer',
    'CandidatRHUpdateSerializer',  # ← nouveau
]