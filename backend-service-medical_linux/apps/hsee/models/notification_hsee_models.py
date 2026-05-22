from django.db import models

from apps.act_infirmier.models import AccidentTravail, EnqueteAccident


class NotificationHSSE(models.Model):
    """Notification HSSE générée lors de la création d'une enquête accident."""

    enquete = models.OneToOneField(
        EnqueteAccident,
        on_delete=models.CASCADE,
        related_name="notification_hsse",
        verbose_name="Enquête accident",
    )
    accident = models.ForeignKey(
        AccidentTravail,
        on_delete=models.CASCADE,
        related_name="notifications_hsse",
        verbose_name="Accident de travail",
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    lu = models.BooleanField(default=False)
    date_lecture = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-date_creation"]
        verbose_name = "Notification HSSE"
        verbose_name_plural = "Notifications HSSE"

    def __str__(self):
        return f"Notification HSSE #{self.pk} - accident {self.accident_id}"
