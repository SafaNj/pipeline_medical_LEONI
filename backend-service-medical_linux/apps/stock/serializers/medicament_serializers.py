from rest_framework import serializers

from apps.account.utils import get_site_utilisateur
from apps.stock.models import Medicament, StockMedicament


class MedicamentSerializer(serializers.ModelSerializer):
    stock_info = serializers.SerializerMethodField()
    unite_display = serializers.SerializerMethodField()
    conditionnement_display = serializers.SerializerMethodField()

    class Meta:
        model = Medicament
        fields = '__all__'
        read_only_fields = ['site']

    def validate(self, data):
        cond = data.get('conditionnement', getattr(self.instance, 'conditionnement', ''))
        cond_perso = data.get('conditionnement_personnalise', getattr(self.instance, 'conditionnement_personnalise', ''))
        if cond == 'autre' and not cond_perso.strip():
            raise serializers.ValidationError(
                {'conditionnement_personnalise': "Ce champ est obligatoire quand le conditionnement est « Autre »."}
            )
        # Si pas 'autre', on vide le champ personnalisé pour cohérence
        if cond != 'autre':
            data['conditionnement_personnalise'] = ''

        unite = data.get('unite', getattr(self.instance, 'unite', ''))
        unite_p = data.get('unite_personnalise', getattr(self.instance, 'unite_personnalise', ''))
        if unite == 'autre' and not (unite_p or '').strip():
            raise serializers.ValidationError(
                {'unite_personnalise': "Précisez l'unité lorsque « Autre » est sélectionné."}
            )
        if unite != 'autre':
            data['unite_personnalise'] = ''

        return data

    def get_conditionnement_display(self, obj):
        if obj.conditionnement == 'autre' and obj.conditionnement_personnalise:
            return obj.conditionnement_personnalise
        return obj.get_conditionnement_display()

    def get_stock_info(self, obj):
        request = self.context.get('request')
        site = get_site_utilisateur(getattr(request, 'user', None)) if request else None

        stocks = obj.stocks.all()
        if site is not None:
            stocks = stocks.filter(site=site)

        stock = stocks.order_by('id').first()
        if not stock:
            return {
                'id': None,          # FIX : frontend besoin de id pour stockId
                'quantite': 0,
                'seuil_alerte': 0,
                'date_expiration': None,
                'statut': 'EPUISE',
                'unite': obj.unite,
                'unite_display': self.get_unite_display(obj),
            }

        if stock.quantite == 0:
            statut = 'EPUISE'
        elif stock.quantite <= stock.seuil_alerte:
            statut = 'FAIBLE'
        else:
            statut = 'OK'

        return {
            'id': stock.id,          # FIX : était absent → stockId=undefined → URL /stocks/undefined/ → 500
            'quantite': stock.quantite,
            'seuil_alerte': stock.seuil_alerte,
            'date_expiration': str(stock.date_expiration) if stock.date_expiration else None,
            'statut': statut,
            'unite': obj.unite,
            'unite_display': self.get_unite_display(obj),
        }

    def get_unite_display(self, obj):
        if obj.unite == 'autre' and (obj.unite_personnalise or '').strip():
            return obj.unite_personnalise.strip()
        return obj.get_unite_display()