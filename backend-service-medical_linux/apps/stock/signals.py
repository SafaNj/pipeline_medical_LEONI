"""Stock signals intentionally disabled.

Stock deduction is handled directly in viewsets within explicit DB transactions:
- apps.consultations.views.ligne_ordonnance_viewsets.LigneOrdonnanceViewSet.donner
- apps.stock.views.acte_infirmier_viewsets.ActeInfirmierViewSet.perform_create
"""
