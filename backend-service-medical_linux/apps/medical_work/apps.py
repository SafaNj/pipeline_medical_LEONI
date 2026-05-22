from django.apps import AppConfig


class MedicalWorkConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.medical_work'

    def ready(self):
        import apps.medical_work.signals  # noqa: F401
