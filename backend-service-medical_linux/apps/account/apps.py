from django.apps import AppConfig

class AccountConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.account'

    def ready(self):
        # importer les signals pour qu'ils soient activés
        import apps.account.signals