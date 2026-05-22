from django.db import models

from apps.account.models import Profile


class ListeEmbauche(models.Model):
	STATUT_BROUILLON = 'BROUILLON'
	STATUT_SOUMISE = 'SOUMISE'
	STATUT_EN_TRAITEMENT = 'EN_TRAITEMENT'
	STATUT_CLOTUREE = 'CLOTUREE'
	STATUT_ARCHIVEE = 'ARCHIVEE'

	STATUT_CHOICES = [
		(STATUT_BROUILLON, 'Brouillon'),
		(STATUT_SOUMISE, 'Soumise'),
		(STATUT_EN_TRAITEMENT, 'En traitement'),
		(STATUT_CLOTUREE, 'Cloturee'),
		(STATUT_ARCHIVEE, 'Archivee'),
	]

	reference = models.CharField(max_length=20, unique=True, editable=False)
	date_visite = models.DateField(null=True, blank=True)
	statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default=STATUT_BROUILLON)
	fichier_excel = models.FileField(upload_to='embauche/', null=True, blank=True)
	medecin = models.ForeignKey(
		'account.Medecin',
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name='listes_embauche_assignees',
	)
	cree_par = models.ForeignKey(
		Profile,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name='listes_embauche_creees',
	)
	date_creation = models.DateTimeField(auto_now_add=True)
	date_modification = models.DateTimeField(auto_now=True)
	sms_veille_envoye = models.BooleanField(
		default=False,
		verbose_name='SMS rappel veille (J-1) envoyé',
	)

	class Meta:
		ordering = ['-date_creation']
		verbose_name = 'Liste embauche'
		verbose_name_plural = 'Listes embauche'

	def __str__(self):
		return f'{self.reference} - {self.date_visite}'

	def save(self, *args, **kwargs):
		if not self.reference:
			year = self.date_visite.year if self.date_visite else None
			if not year:
				from django.utils import timezone

				year = timezone.localdate().year

			prefix = f'EMB-{year}-'
			last = (
				ListeEmbauche.objects.filter(reference__startswith=prefix)
				.order_by('-reference')
				.first()
			)
			next_num = 1
			if last and last.reference:
				try:
					next_num = int(last.reference.split('-')[-1]) + 1
				except (ValueError, IndexError):
					next_num = 1

			self.reference = f'{prefix}{next_num:03d}'

		super().save(*args, **kwargs)

