# account/admin/profile_admin.py
from django.contrib import admin
from apps.account.models.profil_models import Profile, MedType

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role")
    list_filter = ("role",)

@admin.register(MedType)
class MedTypeAdmin(admin.ModelAdmin):
    list_display = ("name",)