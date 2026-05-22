from django.contrib import admin
from django.db.models import Q

from apps.planning.models.liste_passage_models import ListePassage
from apps.planning.models.item_passage_models import ItemPassage
from apps.account.models.medecin_models import Medecin


class ItemPassageInline(admin.TabularInline):
    model = ItemPassage
    extra = 0
    fields = ("collaborateur", "motif", "statut")
    readonly_fields = ("ordre",)


@admin.register(ListePassage)
class ListePassageAdmin(admin.ModelAdmin):
    list_display = ("date", "session", "type_liste", "medecin", "statut")
    list_filter = ("date", "session", "type_liste", "statut")
    search_fields = ("medecin__profile__user__username",)
    ordering = ("-date", "session")
    inlines = [ItemPassageInline]
    readonly_fields = ("created_at", "updated_at")

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "medecin":
            kwargs["queryset"] = Medecin.objects.filter(
                Q(med_type__name__icontains="trait")
                | Q(med_type__name__icontains="control")
                | Q(med_type__name__icontains="contrôl")
            )
        return super().formfield_for_foreignkey(db_field, request, **kwargs)