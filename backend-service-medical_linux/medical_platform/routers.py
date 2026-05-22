class IMDatabaseRouter:
    def db_for_read(self, model, **hints):
        if model._meta.model_name == 'resourceim':
            return 'im_db'
        return None

    def db_for_write(self, model, **hints):
        if model._meta.model_name == 'resourceim':
            return 'im_db'
        return None

    def allow_relation(self, obj1, obj2, **hints):
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if db == 'im_db':
            return False
        return None
