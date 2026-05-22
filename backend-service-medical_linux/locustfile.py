# =============================================================
#  locustfile.py — Tests de charge Plateforme Médicale LEONI
#  Correction complète : token JWT extrait depuis "access"
#
#  ⚠ PRÉREQUIS : backend Django DOIT tourner sur localhost:8000
#    → python manage.py runserver  (dans un terminal séparé)
#
#  Lancer avec :
#    python -m locust -f locustfile.py --host=http://localhost:8000 ^
#      --headless -u 50 -r 5 --run-time 60s --csv=locust-results
# =============================================================

from locust import HttpUser, task, between

class UtilisateurMedical(HttpUser):
    """
    Simule un utilisateur réel de la plateforme médicale LEONI.
    Weights réalistes : login rare (1x), lectures fréquentes (4-10x)
    """
    wait_time = between(1, 3)
    token = None

    # ── Login au démarrage de chaque utilisateur virtuel ─────
    def on_start(self):
        self.login()

    def login(self):
        """
        POST /api/account/login/
        La réponse retourne {"access": "...", "refresh": "...", "role": ...}
        → token extrait depuis data["access"]
        """
        with self.client.post(
            "/api/account/login/",
            json={"username": "adam_znayti", "password": "Wiem123*"},
            catch_response=True,
            name="POST /api/account/login/"
        ) as resp:
            if resp.status_code == 200:
                data = resp.json()
                # Clé exacte confirmée dans auth_views.py ligne 71
                self.token = data.get("access", "")
                if self.token:
                    resp.success()
                else:
                    resp.failure("Token 'access' absent de la réponse")
            else:
                resp.failure(f"Login échoué {resp.status_code}: {resp.text[:100]}")

    def headers(self):
        """Headers JWT pour les requêtes authentifiées."""
        if not self.token:
            self.login()
        return {"Authorization": f"Bearer {self.token}"}

    # ── TÂCHE 1 : Listes visites périodiques — weight=10 ─────
    # Endpoint le plus consulté par médecins et infirmiers
    @task(10)
    def get_listes_vp(self):
        with self.client.get(
            "/api/medical-work/listes-visites-periodiques/",
            headers=self.headers(),
            catch_response=True,
            name="GET /api/medical-work/listes-visites-periodiques/"
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            elif resp.status_code == 401:
                self.login()
                resp.failure("Token expiré — re-login")
            else:
                resp.failure(f"VP: {resp.status_code}")

    # ── TÂCHE 2 : Dossiers médicaux — weight=8 ───────────────
    # Consulté à chaque visite patient
    @task(8)
    def get_dossiers(self):
        with self.client.get(
            "/api/medical-records/dossiers/",
            headers=self.headers(),
            catch_response=True,
            name="GET /api/medical-records/dossiers/"
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            elif resp.status_code == 401:
                self.login()
                resp.failure("Token expiré — re-login")
            else:
                resp.failure(f"Dossiers: {resp.status_code}")

    # ── TÂCHE 3 : Stock médicaments — weight=6 ───────────────
    # Consulté par infirmiers en début de service
    @task(6)
    def get_stock(self):
        with self.client.get(
            "/api/stock/medicaments/",
            headers=self.headers(),
            catch_response=True,
            name="GET /api/stock/medicaments/"
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            elif resp.status_code == 401:
                self.login()
                resp.failure("Token expiré — re-login")
            else:
                resp.failure(f"Stock: {resp.status_code}")

    # ── TÂCHE 4 : Alertes stock — weight=4 ───────────────────
    # Vérification ruptures de stock
    @task(4)
    def get_alertes(self):
        with self.client.get(
            "/api/stock/stocks/alertes/",
            headers=self.headers(),
            catch_response=True,
            name="GET /api/stock/stocks/alertes/"
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            elif resp.status_code == 401:
                self.login()
                resp.failure("Token expiré — re-login")
            else:
                resp.failure(f"Alertes: {resp.status_code}")

    # ── TÂCHE 5 : Re-login — weight=1 ────────────────────────
    # Simule expiration de session
    @task(1)
    def relogin(self):
        self.login()