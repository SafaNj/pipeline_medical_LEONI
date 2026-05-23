#!/bin/bash
# Bootstrap script — runs as root on first EC2 boot via cloud-init.
# Terraform templatefile resolves all interpolation tokens before upload to EC2.
set -euo pipefail
exec > >(tee /var/log/medical-bootstrap.log 2>&1) 2>&1

echo "=========================================================="
echo "  Medical App Bootstrap -- $(date)"
echo "=========================================================="

# Terraform-injected secrets (expanded at plan time, before upload)
export DB_APP_PASSWORD="${db_app_password}"
export MYSQL_ROOT_PASSWORD="${mysql_root_password}"
export ELASTIC_IP="${elastic_ip}"

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

apt-get install -y \
  python3 python3-pip python3-venv python3-dev \
  unzip curl git nginx \
  mysql-server libmysqlclient-dev pkg-config build-essential

curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "  node  : $(node --version)"
echo "  npm   : $(npm --version)"
echo "  python: $(python3 --version)"
echo "  mysql : $(mysql --version)"

mkdir -p /opt/install

# Write install scripts directly — backend.sh uses $VAR (no braces) so
# Terraform's template engine never tries to expand those shell variables.
cat > /opt/install/backend.sh << 'BACKEND_END'
${backend_script}
BACKEND_END

cat > /opt/install/frontend.sh << 'FRONTEND_END'
${frontend_script}
FRONTEND_END

chmod +x /opt/install/backend.sh /opt/install/frontend.sh

echo "--- Running backend setup ---"
DB_APP_PASSWORD="$DB_APP_PASSWORD" MYSQL_ROOT_PASSWORD="$MYSQL_ROOT_PASSWORD" ELASTIC_IP="$ELASTIC_IP" bash /opt/install/backend.sh

echo "--- Running frontend setup ---"
ELASTIC_IP="$ELASTIC_IP" bash /opt/install/frontend.sh

echo "=========================================================="
echo "  Bootstrap complete -- $(date)"
echo "  Elastic IP : $ELASTIC_IP"
echo "  Frontend   : http://$ELASTIC_IP"
echo "  Backend    : http://$ELASTIC_IP:8000"
echo "  API proxy  : http://$ELASTIC_IP/api"
echo "  Log        : /var/log/medical-bootstrap.log"
echo "=========================================================="
