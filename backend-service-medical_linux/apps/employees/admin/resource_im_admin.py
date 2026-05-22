from django.contrib import admin

from apps.employees.models import ResourceIM


@admin.register(ResourceIM)
class ResourceIMAdmin(admin.ModelAdmin):
    list_display = (
        'matricule',
        'name',
        'firstname',
        'department',
        'fonction',
        'status_actif',
    )
    search_fields = ('matricule', 'name', 'firstname', 'lastname', 'CIN')
    list_filter = ('department', 'fonction', 'status_actif')
    ordering = ('matricule',)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
