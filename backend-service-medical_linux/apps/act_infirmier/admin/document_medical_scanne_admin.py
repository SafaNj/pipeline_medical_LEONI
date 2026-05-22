from django.contrib import admin

from apps.act_infirmier.models import DocumentMedicalScanne


@admin.register(DocumentMedicalScanne)
class DocumentMedicalScanneAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "collaborateur",
        "matricule_ref",
        "type_document",
        "titre",
        "date_document",
        "depose_par",
        "date_depot",
    )
    list_filter = ("type_document", "date_depot")
    search_fields = ("collaborateur__matricule", "matricule_ref", "titre", "commentaire")
    readonly_fields = ("date_depot", "depose_par")
    ordering = ("-date_depot",)

    def save_model(self, request, obj, form, change):
        if not change:
            obj.depose_par = request.user
        super().save_model(request, obj, form, change)
