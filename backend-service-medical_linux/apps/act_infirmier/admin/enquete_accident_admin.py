from django.contrib import admin

from apps.act_infirmier.models import EnqueteAccident


@admin.register(EnqueteAccident)
class EnqueteAccidentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "accident",
        "telephone_victime",
        "appartenance",
        "redige_par",
        "date_redaction",
    )
    list_filter = ("date_redaction",)
    search_fields = (
        "accident__id",
        "telephone_victime",
        "appartenance",
        "circonstances",
    )
    raw_id_fields = ("accident", "redige_par")
    readonly_fields = ("date_redaction", "date_modification")
