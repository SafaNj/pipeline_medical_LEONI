class CollaborateurFieldsMixin:
    def get_collaborateur_nom(self, obj):
        if not obj.collaborateur:
            return None
        try:
            full_name = f"{obj.collaborateur.nom} {obj.collaborateur.prenom}".strip()
            return full_name or f"Matricule {obj.collaborateur.matricule}"
        except Exception:
            return f"Matricule {obj.collaborateur.matricule}"

    def get_matricule(self, obj):
        if not obj.collaborateur:
            return None
        try:
            return obj.collaborateur.matricule
        except Exception:
            return None
