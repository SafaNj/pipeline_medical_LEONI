#!/bin/bash
# setup.sh — idempotent deploy/update script for the medical application.
# Called by Job 3 of the GitHub Actions pipeline.
# VM_EXISTS=true  → existing VM, do a full in-place update.
# VM_EXISTS=false → fresh Terraform VM, user_data is bootstrapping; just wait.
set -euo pipefail
exec > >(tee /var/log/setup.log 2>&1) 2>&1

BACKEND_URL="https://github.com/WiemHamila/pipeline_medical_LEONI/releases/download/v1.0/backend-service-medical_linux.zip"
FRONTEND_URL="https://github.com/WiemHamila/pipeline_medical_LEONI/releases/download/v1.0/frontend-service-medical_linux.zip"
INSTALL_DIR="/opt/backend"
FRONTEND_DIR="/opt/frontend"
WEB_ROOT="/var/www/medical-frontend"
SERVICE_USER="ubuntu"
ELASTIC_IP="${ELASTIC_IP:-$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'localhost')}"
VM_EXISTS="${VM_EXISTS:-false}"

echo "=========================================================="
echo "  Setup Medical App — $(date)"
echo "  Mode : $([ "$VM_EXISTS" = "true" ] && echo "mise a jour VM existante" || echo "nouvelle VM — attente bootstrap")"
echo "  IP   : $ELASTIC_IP"
echo "=========================================================="

# ── Cas 1 : nouvelle VM (Terraform vient de la creer) ─────────────────────
# user_data.sh fait deja tout le travail. On attend qu'il se termine.
if [ "$VM_EXISTS" != "true" ]; then
  echo "Attente du bootstrap user_data (jusqu'a 30 min)..."
  for i in $(seq 1 60); do
    if grep -q "Bootstrap complete" /var/log/medical-bootstrap.log 2>/dev/null; then
      echo "Bootstrap complete detecte (log). OK"
      break
    fi
    if systemctl is-active --quiet medical-backend && systemctl is-active --quiet nginx; then
      echo "Services actifs detectes. Bootstrap termine."
      break
    fi
    if [ "$i" -eq 60 ]; then
      echo "WARN: timeout 30min atteint — verification de l'etat..."
    fi
    echo "  Attente $i/60 (30s)..."
    sleep 30
  done
  echo ""
  echo "=== Etat des services ==="
  systemctl status medical-backend nginx mysql --no-pager || true
  exit 0
fi

# ── Cas 2 : mise a jour d'une VM existante ────────────────────────────────
echo ""
echo "=== Mise a jour du backend ==="

systemctl stop medical-backend 2>/dev/null || true

echo "[backend] Telechargement..."
curl -fL --retry 3 -o /tmp/backend_new.zip "$BACKEND_URL"
unzip -o /tmp/backend_new.zip -d /tmp/backend_new_raw

MANAGE_PY=$(find /tmp/backend_new_raw -name "manage.py" | sort | head -1)
[ -z "$MANAGE_PY" ] && { echo "ERROR: manage.py introuvable"; exit 1; }
PROJECT_ROOT=$(dirname "$MANAGE_PY")

# Sauvegarder le .env, remplacer les sources, restaurer le .env
cp "$INSTALL_DIR/.env" /tmp/.env_backup 2>/dev/null || true
rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
cp -r "$PROJECT_ROOT"/. "$INSTALL_DIR/"
cp /tmp/.env_backup "$INSTALL_DIR/.env" 2>/dev/null || true

# Mettre a jour l'IP dans le .env si elle a change
if [ -f "$INSTALL_DIR/.env" ]; then
  sed -i "s/ALLOWED_HOSTS=.*/ALLOWED_HOSTS=localhost,127.0.0.1,$ELASTIC_IP/" "$INSTALL_DIR/.env"
  sed -i "s|CORS_ALLOWED_ORIGINS=.*|CORS_ALLOWED_ORIGINS=http://$ELASTIC_IP,http://$ELASTIC_IP:8000|" "$INSTALL_DIR/.env"
fi

echo "[backend] Recréation du venv..."
rm -rf "$INSTALL_DIR/venv"
python3 -m venv "$INSTALL_DIR/venv"
"$INSTALL_DIR/venv/bin/pip" install --upgrade pip -q
"$INSTALL_DIR/venv/bin/pip" install gunicorn -q
[ -f "$INSTALL_DIR/requirements.txt" ] && \
  "$INSTALL_DIR/venv/bin/pip" install -r "$INSTALL_DIR/requirements.txt" -q

# Patch STATIC_ROOT si absent
grep -q "STATIC_ROOT" "$INSTALL_DIR/medical_platform/settings.py" || \
  printf '\nSTATIC_ROOT = BASE_DIR / '"'"'staticfiles'"'"'\n' >> "$INSTALL_DIR/medical_platform/settings.py"

mkdir -p "$INSTALL_DIR/media"

echo "[backend] Migrations..."
cd "$INSTALL_DIR"
"$INSTALL_DIR/venv/bin/python" manage.py migrate --noinput
"$INSTALL_DIR/venv/bin/python" manage.py migrate --database=im_db --noinput 2>/dev/null || \
  echo "WARN: im_db migration skipped"

echo "[backend] Static files..."
"$INSTALL_DIR/venv/bin/python" manage.py collectstatic --noinput 2>/dev/null || true

chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
touch /var/log/gunicorn-access.log /var/log/gunicorn-error.log
chown "$SERVICE_USER:$SERVICE_USER" /var/log/gunicorn-access.log /var/log/gunicorn-error.log

systemctl start medical-backend
echo "[backend] Redémarre OK"

echo ""
echo "=== Mise a jour du frontend ==="

echo "[frontend] Telechargement..."
curl -fL --retry 3 -o /tmp/frontend_new.zip "$FRONTEND_URL"
unzip -o /tmp/frontend_new.zip -d /tmp/frontend_new_raw

PACKAGE_JSON=$(find /tmp/frontend_new_raw -name "package.json" ! -path "*/node_modules/*" | sort | head -1)
[ -z "$PACKAGE_JSON" ] && { echo "ERROR: package.json introuvable"; exit 1; }
FRONTEND_ROOT=$(dirname "$PACKAGE_JSON")
rm -rf "$FRONTEND_DIR"
mkdir -p "$FRONTEND_DIR"
cp -r "$FRONTEND_ROOT"/. "$FRONTEND_DIR/"

cd "$FRONTEND_DIR"
echo "[frontend] npm install..."
npm install --legacy-peer-deps -q
echo "[frontend] npm run build..."
npm run build

BUILD_DIR=""
[ -d "$FRONTEND_DIR/dist"  ] && [ -f "$FRONTEND_DIR/dist/index.html"  ] && BUILD_DIR="$FRONTEND_DIR/dist"
[ -d "$FRONTEND_DIR/build" ] && [ -f "$FRONTEND_DIR/build/index.html" ] && BUILD_DIR="$FRONTEND_DIR/build"
[ -z "$BUILD_DIR" ] && { echo "ERROR: pas de dossier dist/ ou build/"; exit 1; }

mkdir -p "$WEB_ROOT"
cp -r "$BUILD_DIR"/. "$WEB_ROOT/"
systemctl reload nginx
echo "[frontend] Rechargé OK"

# Nettoyage
rm -f /tmp/backend_new.zip /tmp/frontend_new.zip
rm -rf /tmp/backend_new_raw /tmp/frontend_new_raw

echo ""
echo "=========================================================="
echo "  Mise a jour complete — $(date)"
echo "  Frontend : http://$ELASTIC_IP"
echo "  Backend  : http://$ELASTIC_IP:8000"
echo "=========================================================="
