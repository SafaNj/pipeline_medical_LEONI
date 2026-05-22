# apps/consultations/serializers/ligne_ordonnance_serializers.py
from rest_framework import serializers

# Import DIRECT depuis le modèle — jamais via apps.consultations.serializers
from apps.consultations.models import LigneOrdonnance
from apps.stock.models import Medicament


class LigneOrdonnanceSerializer(serializers.ModelSerializer):
    medicament_info    = serializers.SerializerMethodField(read_only=True)
    stock_info         = serializers.SerializerMethodField(read_only=True)
    collaborateur_info = serializers.SerializerMethodField(read_only=True)
    date_ordonnance    = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = LigneOrdonnance
        fields = '__all__'
        read_only_fields = ('ordre', 'created_at')

    def get_medicament_info(self, obj):
        if not obj.medicament:
            return None
        return {
            'id':     obj.medicament_id,
            'nom':    getattr(obj.medicament, 'nom', str(obj.medicament)),
            'dosage': getattr(obj.medicament, 'dosage', ''),
            'unite':  getattr(obj.medicament, 'unite', ''),
        }

    def get_stock_info(self, obj):
        if not obj.medicament_id:
            return {'quantite': 0, 'statut': 'NON_REFERENCE'}
        stocks = list(obj.medicament.stocks.all())
        stock = stocks[0] if stocks else None
        if not stock:
            return {'quantite': 0, 'statut': 'EPUISE'}
        if stock.quantite == 0:
            statut = 'EPUISE'
        elif stock.quantite <= stock.seuil_alerte:
            statut = 'FAIBLE'
        else:
            statut = 'OK'
        return {'quantite': stock.quantite, 'statut': statut, 'stock_id': stock.id}

    def get_collaborateur_info(self, obj):
        try:
            c = obj.ordonnance.consultation.collaborateur
            if not c:
                return None
            return {
                'id':        c.id,
                'nom':       c.nom,
                'prenom':    c.prenom,
                'matricule': getattr(c, 'matricule', ''),
                'poste':     getattr(c, 'poste', ''),
            }
        except Exception:
            return None

    def get_date_ordonnance(self, obj):
        try:
            return str(obj.ordonnance.date_emission)
        except Exception:
            return None

    def _find_medicament_by_text(self, texte):
        """
        Essaie de trouver un médicament basé sur le texte de la ligne.
        Stratégies:
        1. Exact match (insensible à la casse)
        2. Match du premier mot
        3. Match partiel (nom du médicament dans le texte)
        """
        if not texte:
            return None
        
        texte_strip = texte.strip()
        
        # Stratégie 1: Exact match
        medicament = Medicament.objects.filter(nom__iexact=texte_strip).first()
        if medicament:
            return medicament
        
        # Stratégie 2: Match du premier mot
        premier_mot = texte_strip.split()[0] if texte_strip else ''
        if premier_mot:
            medicament = Medicament.objects.filter(nom__iexact=premier_mot).first()
            if medicament:
                return medicament
        
        # Stratégie 3: Match du nom du médicament dans le texte
        medicaments = Medicament.objects.all()
        for med in medicaments:
            if med.nom.lower() in texte_strip.lower():
                return med
        
        return None

    def create(self, validated_data):
        """
        Crée une ligne d'ordonnance et essaie de lier automatiquement le médicament
        si celui-ci n'est pas fourni mais peut être déduit du texte.
        """
        # Si medicament_id n'est pas fourni, essayer de le trouver à partir du texte
        if not validated_data.get('medicament_id') and validated_data.get('texte'):
            medicament = self._find_medicament_by_text(validated_data['texte'])
            if medicament:
                validated_data['medicament_id'] = medicament.id
        
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """
        Met à jour une ligne d'ordonnance et essaie de lier automatiquement le médicament
        si celui-ci n'est pas fourni mais peut être déduit du texte.
        """
        # Si medicament_id n'est pas fourni et texte a changé, essayer de le trouver
        texte = validated_data.get('texte', instance.texte)
        if not validated_data.get('medicament_id') and not instance.medicament_id and texte:
            medicament = self._find_medicament_by_text(texte)
            if medicament:
                validated_data['medicament_id'] = medicament.id
        
        return super().update(instance, validated_data)