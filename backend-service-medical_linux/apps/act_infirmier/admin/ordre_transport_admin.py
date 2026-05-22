from django.contrib import admin
from apps.act_infirmier.models import OrdreTransport


@admin.register(OrdreTransport)
class OrdreTransportAdmin(admin.ModelAdmin):
    list_display = (
        "get_num_ordre", "get_date", "get_collaborateur",
        "get_hopital", "medecin", "moyen_transport", "montant_prime"
    )
    list_filter    = ("moyen_transport", "transfert__date")
    search_fields  = (
        "transfert__collaborateur__matricule",
        "transfert__destination",
        "transfert__chauffeur",
    )
    readonly_fields = ("infirmier", "date_creation")
    date_hierarchy  = "transfert__date"

    fieldsets = (
        ("Transfert lié", {
            "fields": ("transfert",)
        }),
        ("Informations médicales", {
            "fields": ("medecin", "motif", "accompagnant")
        }),
        ("Transport", {
            "fields": ("moyen_transport", "montant_prime")
        }),
        ("Système", {
            "fields": ("infirmier", "date_creation"),
            "classes": ("collapse",)
        }),
    )

    def get_num_ordre(self, obj): return obj.transfert.num_ordre
    def get_date(self, obj):      return obj.transfert.date
    def get_collaborateur(self, obj): return obj.transfert.collaborateur
    def get_hopital(self, obj):   return obj.transfert.destination

    get_num_ordre.short_description    = "N° Ordre"
    get_date.short_description         = "Date"
    get_collaborateur.short_description = "Collaborateur"
    get_hopital.short_description      = "Hôpital"
