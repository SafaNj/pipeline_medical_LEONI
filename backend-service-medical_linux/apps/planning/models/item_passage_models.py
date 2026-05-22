from django.db import models


class ItemPassage(models.Model):
    STATUS_WAITING = 'EN_ATTENTE'
    STATUS_DONE = 'EFFECTUEE'
    STATUS_CANCELLED = 'ANNULEE'
    STATUS_CHOICES = [
        (STATUS_WAITING, 'En attente'),
        (STATUS_DONE, 'Effectuée'),
        (STATUS_CANCELLED, 'Annulée'),
    ]

    liste = models.ForeignKey('planning.ListePassage', related_name='items', on_delete=models.CASCADE)
    ordre = models.PositiveIntegerField(null=True, blank=True, editable=False)
    # link to internal Collaborateur in apps.employees
    collaborateur = models.ForeignKey('employees.Collaborateur', on_delete=models.SET_NULL, null=True, blank=True)
    motif = models.TextField(null=True, blank=True)
    statut = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_WAITING)
    sms_envoye = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Item de passage'
        verbose_name_plural = 'Items de passage'
        ordering = ['ordre']

    def _send_n_plus_2_notification_after_done(self):
        waiting_items = list(
            ItemPassage.objects.filter(liste=self.liste, statut=ItemPassage.STATUS_WAITING)
            .order_by('ordre')
        )

        after_current = [
            i for i in waiting_items
            if i.ordre is not None and self.ordre is not None and i.ordre > self.ordre
        ]
        if len(after_current) < 2:
            return

        target = after_current[1]
        collab = target.collaborateur
        if not collab or not getattr(collab, 'telephone', None):
            return

        if target.sms_envoye:
            return

        cancelled_before_target = ItemPassage.objects.filter(
            liste=self.liste,
            ordre__gt=self.ordre,
            ordre__lt=target.ordre,
            statut=ItemPassage.STATUS_CANCELLED,
        ).count()

        if cancelled_before_target:
            text = (
                "Bonjour, votre tour approche bientôt (quelques annulations entre temps), "
                "veuillez vous rendre à l'infirmerie"
            )
        else:
            text = "Bonjour, votre tour approche, veuillez vous rendre à l'infirmerie"

        # Import local pour éviter les imports circulaires au chargement des apps.
        from apps.planning.sms_service import send_sms

        send_sms(collab.telephone, text, item=target)

    def save(self, *args, **kwargs):
        # auto-assign ordre as next integer in the liste if not already set
        previous_status = None
        if self.pk is not None:
            previous_status = ItemPassage.objects.filter(pk=self.pk).values_list('statut', flat=True).first()

        if self.ordre is None and self.liste_id is not None:
            last = ItemPassage.objects.filter(liste=self.liste).order_by('-ordre').first()
            next_ord = 1
            if last and last.ordre:
                next_ord = last.ordre + 1
            self.ordre = next_ord

        update_fields = kwargs.get('update_fields')
        if (
            previous_status is not None
            and previous_status != self.STATUS_WAITING
            and self.statut == self.STATUS_WAITING
            and self.sms_envoye
        ):
            self.sms_envoye = False
            if update_fields is not None:
                kwargs['update_fields'] = set(update_fields) | {'sms_envoye'}

        super().save(*args, **kwargs)

        if (
            previous_status is not None
            and previous_status != self.STATUS_DONE
            and self.statut == self.STATUS_DONE
        ):
            self._send_n_plus_2_notification_after_done()

    def __str__(self):
        who = self.collaborateur or '—'
        return f"#{self.ordre} — {who} ({self.get_statut_display()})"
