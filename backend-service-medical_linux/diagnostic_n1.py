# =============================================================
#  diagnostic_n1.py — Vérification requêtes N+1
#  Modèles réels :
#    - visites_periodiques.ListeVisitePeriodique
#    - medical_records.DossierMedical
#    - stock.Medicament
#
#  Lancer avec :
#    cd D:\TESTTT\backend-service-medical
#    python diagnostic_n1.py
# =============================================================

import os, sys, time
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medical_platform.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    django.setup()
    print("✓ Django setup OK\n")
except Exception as e:
    print(f"Erreur setup Django: {e}")
    sys.exit(1)

from django.db import connection, reset_queries
from django.conf import settings
settings.DEBUG = True  # Active le log SQL

print("=" * 60)
print("  DIAGNOSTIC N+1 — Requêtes SQL par endpoint métier")
print("=" * 60)

# ── HELPER ───────────────────────────────────────────────────
def mesurer(label, fn):
    reset_queries()
    start = time.time()
    try:
        result = fn()
        # Forcer l'évaluation du queryset
        if hasattr(result, '__iter__'):
            result = list(result)
    except Exception as e:
        print(f"  [ERREUR] {label}: {e}")
        return 0, 0
    elapsed = (time.time() - start) * 1000
    nb = len(connection.queries)
    seuil_ok = nb <= 5
    print(f"\n  [{label}]")
    print(f"  Requêtes SQL : {nb} {'✓ OK' if seuil_ok else '⚠ N+1 DÉTECTÉ'}")
    print(f"  Temps        : {elapsed:.1f} ms")
    if not seuil_ok:
        print(f"  → Ajouter select_related() ou prefetch_related()")
    # Afficher les requêtes lentes
    for q in connection.queries:
        if float(q.get('time', 0)) > 0.03:
            print(f"  LENTE {float(q['time'])*1000:.0f}ms: {q['sql'][:70]}...")
    return nb, elapsed

# ── TEST 1 : ListeVisitePeriodique ───────────────────────────
print("\n" + "─"*40)
print("ENDPOINT : GET /api/medical-work/listes-visites-periodiques/")
try:
    from apps.visites_periodiques.models import ListeVisitePeriodique

    n_avant, t_avant = mesurer(
        "AVANT optimisation",
        lambda: ListeVisitePeriodique.objects.all()[:20]
    )
    n_apres, t_apres = mesurer(
        "APRÈS select_related + prefetch_related",
        lambda: ListeVisitePeriodique.objects.select_related(
            'site', 'medecin'
        ).prefetch_related('lignevisiteperiodique_set')[:20]
    )
    if n_avant > 0 and n_apres < n_avant:
        print(f"\n  ✓ Gain : {n_avant} → {n_apres} requêtes (-{n_avant-n_apres})")
        print(f"  ✓ Temps : {t_avant:.0f}ms → {t_apres:.0f}ms")

except ImportError as e:
    print(f"  Import: {e}")
    # Essai avec le chemin alternatif
    try:
        from visites_periodiques.models import ListeVisitePeriodique
        n_avant, t_avant = mesurer(
            "AVANT optimisation",
            lambda: ListeVisitePeriodique.objects.all()[:20]
        )
    except Exception as e2:
        print(f"  Modèle non accessible en dehors du contexte API: {e2}")
        print("  → Normal : le queryset est filtré par site_id dans la view")

# ── TEST 2 : DossierMedical ──────────────────────────────────
print("\n" + "─"*40)
print("ENDPOINT : GET /api/medical-records/dossiers/")
try:
    from apps.medical_records.models.dossier_models import DossierMedical

    n_avant, t_avant = mesurer(
        "AVANT optimisation",
        lambda: DossierMedical.objects.all()[:20]
    )
    n_apres, t_apres = mesurer(
        "APRÈS select_related",
        lambda: DossierMedical.objects.select_related(
            'collaborateur', 'site'
        )[:20]
    )
    if n_avant > 0 and n_apres < n_avant:
        print(f"\n  ✓ Gain : {n_avant} → {n_apres} requêtes (-{n_avant-n_apres})")

except ImportError as e:
    print(f"  Import: {e}")
    try:
        from medical_records.models.dossier_models import DossierMedical
        mesurer("AVANT", lambda: DossierMedical.objects.all()[:20])
        mesurer("APRÈS select_related", lambda: DossierMedical.objects.select_related('collaborateur','site')[:20])
    except Exception as e2:
        print(f"  Modèle non accessible: {e2}")

# ── TEST 3 : Medicament ──────────────────────────────────────
print("\n" + "─"*40)
print("ENDPOINT : GET /api/stock/medicaments/")
try:
    from apps.stock.models.medicament_models import Medicament

    n_avant, t_avant = mesurer(
        "AVANT optimisation",
        lambda: Medicament.objects.all()[:20]
    )
    n_apres, t_apres = mesurer(
        "APRÈS prefetch_related",
        lambda: Medicament.objects.prefetch_related('stockmedicament_set')[:20]
    )
    if n_avant > 0 and n_apres < n_avant:
        print(f"\n  ✓ Gain : {n_avant} → {n_apres} requêtes (-{n_avant-n_apres})")

except ImportError as e:
    print(f"  Import: {e}")
    try:
        from stock.models.medicament_models import Medicament
        mesurer("AVANT", lambda: Medicament.objects.all()[:20])
        mesurer("APRÈS prefetch", lambda: Medicament.objects.prefetch_related('stockmedicament_set')[:20])
    except Exception as e2:
        print(f"  Modèle non accessible: {e2}")

# ── RAPPORT FINAL ─────────────────────────────────────────────
print("\n" + "=" * 60)
print("  RAPPORT FINAL — Recommandations")
print("=" * 60)
print("""
  Seuil acceptable : ≤ 5 requêtes SQL par endpoint

  Corrections à appliquer dans les ViewSets si N+1 détecté :

  # apps/visites_periodiques/views/liste_vp_views.py
  def get_queryset(self):
      return ListeVisitePeriodique.objects.select_related(
          'site', 'medecin'
      ).prefetch_related(
          'lignevisiteperiodique_set'
      ).filter(site_id=self.request.user.site_id)

  # apps/medical_records/views/dossier_viewsets.py
  def get_queryset(self):
      return DossierMedical.objects.select_related(
          'collaborateur', 'site'
      ).filter(site_id=self.request.user.site_id)

  # apps/stock/views/medicament_viewsets.py
  def get_queryset(self):
      return Medicament.objects.prefetch_related(
          'stockmedicament_set'
      ).filter(site_id=self.request.user.site_id)
""")