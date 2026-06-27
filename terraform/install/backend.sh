#!/bin/bash
# Backend install script -- executed by user_data.sh.
# Uses $VAR (no braces) throughout so Terraform's template engine ignores these tokens.
set -euo pipefail

[ -z "$DB_APP_PASSWORD" ]     && { echo "[backend] DB_APP_PASSWORD required"; exit 1; }
[ -z "$MYSQL_ROOT_PASSWORD" ] && { echo "[backend] MYSQL_ROOT_PASSWORD required"; exit 1; }
[ -z "$ELASTIC_IP" ]          && { echo "[backend] ELASTIC_IP required"; exit 1; }

BACKEND_ZIP_URL="https://github.com/WiemHamila/pipeline_medical_LEONI/releases/download/v1.0/backend-service-medical_linux.zip"
DB_ZIP_URL="https://github.com/WiemHamila/pipeline_medical_LEONI/releases/download/v1.0/db.zip"
INSTALL_DIR="/opt/backend"
SERVICE_USER="ubuntu"
DB_NAME_MAIN="medical_db"
DB_NAME_IM="im_db"
DB_APP_USER="medical_user"

# ── MySQL setup ───────────────────────────────────────────────────────────
echo "[backend] Starting MySQL..."
systemctl start mysql
systemctl enable mysql

echo "[backend] Waiting for MySQL..."
for i in $(seq 1 30); do
  if mysql -u root -e "SELECT 1" &>/dev/null; then
    echo "[backend] MySQL ready"; break
  fi
  sleep 2
  [ "$i" -eq 30 ] && { echo "[backend] ERROR: MySQL timeout"; exit 1; }
done

echo "[backend] Configuring databases and users..."
mysql -u root <<SQL
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$MYSQL_ROOT_PASSWORD';
FLUSH PRIVILEGES;
CREATE DATABASE IF NOT EXISTS $DB_NAME_MAIN CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS $DB_NAME_IM   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_APP_USER'@'localhost' IDENTIFIED BY '$DB_APP_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME_MAIN.* TO '$DB_APP_USER'@'localhost';
GRANT ALL PRIVILEGES ON $DB_NAME_IM.*   TO '$DB_APP_USER'@'localhost';
FLUSH PRIVILEGES;
SQL

# ── Import pre-existing database dumps ───────────────────────────────────
echo "[backend] Downloading database dump (db.zip)..."
curl -fL --retry 3 -o /tmp/db.zip "$DB_ZIP_URL"
unzip -o /tmp/db.zip -d /tmp/db_dumps

echo "[backend] Importing medical_db..."
mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$DB_NAME_MAIN" < /tmp/db_dumps/db/medical_db.sql

echo "[backend] Importing im_db..."
mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$DB_NAME_IM" < /tmp/db_dumps/db/im_db.sql

echo "[backend] Database import complete"
rm -f /tmp/db.zip
rm -rf /tmp/db_dumps

# ── Download & extract application ───────────────────────────────────────
echo "[backend] Downloading application..."
mkdir -p "$INSTALL_DIR"
curl -fL --retry 3 -o /tmp/backend.zip "$BACKEND_ZIP_URL"
unzip -o /tmp/backend.zip -d /tmp/backend_raw

MANAGE_PY=$(find /tmp/backend_raw -name "manage.py" | sort | head -1)
[ -z "$MANAGE_PY" ] && { echo "[backend] ERROR: manage.py not found"; exit 1; }
PROJECT_ROOT=$(dirname "$MANAGE_PY")
echo "[backend] Project root: $PROJECT_ROOT"
cp -r "$PROJECT_ROOT"/. "$INSTALL_DIR/"

# ── Python venv — remove stale zip-bundled venv first ────────────────────
echo "[backend] Creating venv and installing dependencies..."
rm -rf "$INSTALL_DIR/venv"
python3 -m venv "$INSTALL_DIR/venv"
"$INSTALL_DIR/venv/bin/pip" install --upgrade pip --quiet
"$INSTALL_DIR/venv/bin/pip" install gunicorn --quiet
[ -f "$INSTALL_DIR/requirements.txt" ] && \
  "$INSTALL_DIR/venv/bin/pip" install -r "$INSTALL_DIR/requirements.txt" --quiet

# ── Generate Django secret key ────────────────────────────────────────────
SECRET_KEY=$(python3 -c "
import secrets, string
chars = string.ascii_letters + string.digits + '!@#%^&*(-_=+)'
print(''.join(secrets.choice(chars) for _ in range(50)))
")

# ── Write .env for python-decouple ───────────────────────────────────────
echo "[backend] Writing .env..."
cat > "$INSTALL_DIR/.env" <<ENV
SECRET_KEY=$SECRET_KEY
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,$ELASTIC_IP
CORS_ALLOWED_ORIGINS=http://$ELASTIC_IP,http://$ELASTIC_IP:8000
DB_USER=$DB_APP_USER
DB_PASSWORD=$DB_APP_PASSWORD
IM_DB_USER=$DB_APP_USER
IM_DB_PASSWORD=$DB_APP_PASSWORD
DB_HOST=localhost
DB_PORT=3306
TUNISIESMS_API_KEY=${TUNISIESMS_API_KEY}
TUNISIESMS_SENDER=LEONI
TUNISIESMS_API_URL=https://app.tunisiesms.tn/api/Api.aspx
JWT_ACCESS_MINUTES=120
JWT_REFRESH_DAYS=7
ENV

# ── Patch settings.py ────────────────────────────────────────────────────
SETTINGS_FILE="$INSTALL_DIR/medical_platform/settings.py"
grep -q "STATIC_ROOT" "$SETTINGS_FILE" || \
  printf '\nSTATIC_ROOT = BASE_DIR / '"'"'staticfiles'"'"'\n' >> "$SETTINGS_FILE"

mkdir -p "$INSTALL_DIR/media"

# ── Migrations (no-op if dump includes django_migrations table) ──────────
echo "[backend] Running migrations..."
cd "$INSTALL_DIR"
"$INSTALL_DIR/venv/bin/python" manage.py migrate --noinput
"$INSTALL_DIR/venv/bin/python" manage.py migrate --database=im_db --noinput 2>/dev/null || \
  echo "[backend] WARN: im_db migration skipped"

# ── Collect static files ─────────────────────────────────────────────────
echo "[backend] Collecting static files..."
"$INSTALL_DIR/venv/bin/python" manage.py collectstatic --noinput 2>/dev/null || \
  echo "[backend] WARN: collectstatic non-zero"

# ── Permissions & log files ───────────────────────────────────────────────
chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
touch /var/log/gunicorn-access.log /var/log/gunicorn-error.log
chown "$SERVICE_USER:$SERVICE_USER" /var/log/gunicorn-access.log /var/log/gunicorn-error.log

# ── Gunicorn systemd service ──────────────────────────────────────────────
echo "[backend] Creating systemd service..."
cat > /etc/systemd/system/medical-backend.service <<SERVICE
[Unit]
Description=Medical Platform -- Django / Gunicorn
After=network.target mysql.service
Requires=mysql.service

[Service]
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR
Environment="PATH=$INSTALL_DIR/venv/bin:/usr/local/bin:/usr/bin:/bin"
ExecStart=$INSTALL_DIR/venv/bin/gunicorn \
    --workers 4 \
    --bind 0.0.0.0:8000 \
    --timeout 120 \
    --access-logfile /var/log/gunicorn-access.log \
    --error-logfile /var/log/gunicorn-error.log \
    medical_platform.wsgi:application
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable medical-backend
systemctl start medical-backend

sleep 3
systemctl status medical-backend --no-pager || true

rm -f /tmp/backend.zip
rm -rf /tmp/backend_raw
echo "[backend] Done -- Gunicorn listening on :8000"
