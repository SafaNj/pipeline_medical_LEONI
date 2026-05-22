from rest_framework import serializers

from apps.act_infirmier.serializers import AccidentTravailSerializer, EnqueteAccidentSerializer
from apps.hsee.models import NotificationHSSE


class NotificationHSSESerializer(serializers.ModelSerializer):
    accident = AccidentTravailSerializer(read_only=True)
    enquete = EnqueteAccidentSerializer(read_only=True)

    class Meta:
        model = NotificationHSSE
        fields = [
            "id",
            "enquete",
            "accident",
            "date_creation",
            "lu",
            "date_lecture",
        ]
        read_only_fields = ["id", "enquete", "accident", "date_creation", "date_lecture"]
