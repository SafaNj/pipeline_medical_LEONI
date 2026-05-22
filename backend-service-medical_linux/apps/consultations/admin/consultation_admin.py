from django.contrib import admin
from django.db.models import Q

from apps.account.models import Medecin
from apps.consultations.models import CertificatMedical, Consultation, Ordonnance
from apps.planning.models import ItemPassage


class OrdonnanceInline(admin.TabularInline):
    model = Ordonnance
    extra = 0
    fields = ('date_emission',)
    readonly_fields = ('date_emission',)


class CertificatInline(admin.TabularInline):
    model = CertificatMedical
    extra = 0
    fields = (
        'jours_repos',
        'date_debut_repos',
        'nom_prenom_medecin',
        'nom_prenom_collab',
    )
    readonly_fields = (
        'nom_prenom_medecin',
        'nom_prenom_collab',
        'date_emission',
    )


@admin.register(Consultation)
class ConsultationAdmin(admin.ModelAdmin):
    list_display = ('collaborateur', 'medecin', 'date_consultation', 'diagnostic')
    list_filter = ('medecin', 'date_consultation')
    search_fields = (
        'item_passage__collaborateur__matricule',
    )
    ordering = ('-date_consultation',)
    readonly_fields = ('date_consultation', 'date_creation')
    inlines = (OrdonnanceInline, CertificatInline)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'item_passage':
            current_item_passage_id = None
            object_id = request.resolver_match.kwargs.get('object_id')
            if object_id:
                consultation = Consultation.objects.filter(pk=object_id).only('item_passage_id').first()
                if consultation:
                    current_item_passage_id = consultation.item_passage_id

            queryset = ItemPassage.objects.filter(
               statut='EN_ATTENTE',
                liste__statut__in=['EN_PREPARATION', 'ACTIVE']
)
            if current_item_passage_id:
                queryset = ItemPassage.objects.filter(
                    Q(statut='EN_ATTENTE') | Q(pk=current_item_passage_id)
                )
            kwargs['queryset'] = queryset

        if db_field.name == 'medecin':
            kwargs['queryset'] = Medecin.objects.filter(med_type__name__icontains='trait')

        return super().formfield_for_foreignkey(db_field, request, **kwargs)