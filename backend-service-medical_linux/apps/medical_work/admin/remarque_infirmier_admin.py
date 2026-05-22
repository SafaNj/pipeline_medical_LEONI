from django.contrib import admin
from apps.medical_work.models.remarque_infirmier_models import RemarqueInfirmier


@admin.register(RemarqueInfirmier)
class RemarqueInfirmierAdmin(admin.ModelAdmin):
    list_display = ['fiche_aptitude', 'infirmier', 'date_creation', 'date_modification']
    list_filter = ['date_creation']
    search_fields = ['fiche_aptitude__collaborateur__matricule', 'remarque', 'reevaluation']
    readonly_fields = ['date_creation', 'date_modification']
