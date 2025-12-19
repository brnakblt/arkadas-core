#!/bin/bash
#########################################################
# Arkadaş Özel Eğitim ERP - Ubuntu Server Setup Script
# Production deployment for Ubuntu 20.04 LTS / 22.04 LTS
# Run with: sudo ./setup_ubuntu_server.sh
#########################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper Functions
echo_step() { echo -e "${BLUE}==>${NC} ${GREEN}$1${NC}"; }
echo_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
echo_error() { echo -e "${RED}❌ $1${NC}"; }
echo_success() { echo -e "${GREEN}✅ $1${NC}"; }

generate_secret() {
    openssl rand -base64 32 | tr -d '/+' | cut -c1-32
}

generate_simple_secret() {
    openssl rand -base64 12 | tr -d '/+'
}

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     Arkadaş Özel Eğitim ERP - Ubuntu Production Setup     ║${NC}"
echo -e "${CYAN}║     Setting up for production deployment                  ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo_error "Please run as root (sudo ./setup_ubuntu_server.sh)"
   exit 1
fi

# Get the actual user (not root)
ACTUAL_USER="${SUDO_USER:-$USER}"
ACTUAL_HOME=$(eval echo ~$ACTUAL_USER)

echo_step "Setting up for user: $ACTUAL_USER"

#########################################################
# 1. System Update
#########################################################
echo_step "Updating system packages..."
apt-get update
apt-get upgrade -y
echo_success "System updated"

#########################################################
# 2. Install Essential Tools
#########################################################
echo_step "Installing essential tools..."
apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    fail2ban \
    unattended-upgrades \
    openssl \
    libpq-dev
echo_success "Essential tools installed"

#########################################################
# 3. Install Node.js (v22 LTS)
#########################################################
echo_step "Installing Node.js v22..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
else
    echo "Node.js $(node -v) already installed"
fi
echo_success "Node.js installed"

#########################################################
# 4. Install Python 3.11
#########################################################
echo_step "Installing Python 3.11..."
add-apt-repository -y ppa:deadsnakes/ppa
apt-get update
apt-get install -y \
    python3.11 \
    python3.11-venv \
    python3.11-dev \
    python3-pip \
    python-is-python3
echo_success "Python 3.11 installed"

#########################################################
# 5. Install PostgreSQL
#########################################################
echo_step "Installing PostgreSQL..."
apt-get install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Configure PostgreSQL Security
echo_step "Configuring PostgreSQL Database..."
DB_NAME="arkadas_erp"
DB_USER="strapi"
DB_PASSWORD=$(generate_simple_secret)

# Check if user exists
if sudo -u postgres psql -t -c '\du' | cut -d \| -f 1 | grep -qw "$DB_USER"; then
    echo_warn "User $DB_USER already exists, resetting password."
    sudo -u postgres psql -c "ALTER USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"
else
    echo_step "Creating user $DB_USER..."
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"
fi

# Check if DB exists
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo_warn "Database $DB_NAME already exists."
else
    echo_step "Creating database $DB_NAME..."
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
fi

echo_success "PostgreSQL configured"
echo_warn "Database Credentials saved to .env files automatically"

#########################################################
# 6. Install Redis
#########################################################
echo_step "Installing Redis..."
apt-get install -y redis-server
systemctl start redis-server
systemctl enable redis-server
sed -i 's/supervised no/supervised systemd/g' /etc/redis/redis.conf
systemctl restart redis-server
echo_success "Redis configured"

#########################################################
# 7. Install NGINX
#########################################################
echo_step "Installing NGINX..."
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx
echo_success "NGINX installed"

#########################################################
# 8. Install PM2
#########################################################
echo_step "Installing PM2..."
npm install -g pm2
pm2 startup systemd -u $ACTUAL_USER --hp $ACTUAL_HOME | bash || true
echo_success "PM2 installed"

#########################################################
# 9. Setup Application Directory
#########################################################
echo_step "Setting up application directory..."
APP_DIR="/var/www/arkadas-erp"

# Ensure directory exists and permissions are right
if [ ! -d "$APP_DIR" ]; then
    mkdir -p $APP_DIR
    echo_success "Application directory created: $APP_DIR"
fi
chown -R $ACTUAL_USER:$ACTUAL_USER $APP_DIR

#########################################################
# 10. Install Application Dependencies & Build
#########################################################
if [ -f "package.json" ]; then
    echo_step "Detected local project, copying files to $APP_DIR..."
    # Exclude node_modules and other heavy/temp files
    rsync -av --exclude 'node_modules' --exclude '.git' --exclude 'nanobanana-output' --exclude '.tmp' --exclude 'dist' . "$APP_DIR/"
    chown -R $ACTUAL_USER:$ACTUAL_USER $APP_DIR
else 
    echo_warn "Run this script from the project root! Assuming we are in project root or files are checked out."
fi

cd $APP_DIR

echo_step "Installing dependencies..."

# Strapi
if [ -d "strapi" ]; then
    echo_step "Installing Strapi dependencies..."
    cd strapi
    sudo -u $ACTUAL_USER npm ci
    cd ..
fi

# Web
if [ -d "web" ]; then
    echo_step "Installing Web dependencies..."
    cd web
    sudo -u $ACTUAL_USER npm ci
    cd ..
fi

# AI Service
if [ -d "ai-service" ]; then
    echo_step "Setting up AI Service..."
    cd ai-service
    sudo -u $ACTUAL_USER python3.11 -m venv venv
    sudo -u $ACTUAL_USER ./venv/bin/pip install --upgrade pip
    sudo -u $ACTUAL_USER ./venv/bin/pip install -r requirements.txt
    
    # Dlib/Face recognition fallback
    echo_step "Checking for dlib..."
    if ! sudo -u $ACTUAL_USER ./venv/bin/python3 -c "import dlib" 2>/dev/null; then
         echo_step "Installing dlib (this might take a while)..."
         sudo -u $ACTUAL_USER ./venv/bin/pip install dlib face-recognition || echo_warn "Dlib install failed, check logs"
    fi
    cd ..
fi

# Mebbis
if [ -d "mebbis-service" ]; then
    echo_step "Installing MEBBIS dependencies..."
    cd mebbis-service
    sudo -u $ACTUAL_USER npm ci
    sudo -u $ACTUAL_USER npx playwright install chromium
    cd ..
fi

#########################################################
# 11. Secure Key Enrollment
#########################################################
echo_step "Generating secure environment files..."

# Generate Global Secrets
GLOBAL_JWT_SECRET=$(generate_secret)
GLOBAL_API_TOKEN_SALT=$(generate_secret)
STRAPI_API_TOKEN=$(generate_secret) # We will need to actually create this in Strapi later or set it fixed. For now, we generate a strong random token.

# Function to update specific keys in a file
update_env_key() {
    local file=$1
    local key=$2
    local value=$3
    # Escape special characters for sed
    local escaped_value=$(echo "$value" | sed -e 's/[\/&]/\\&/g')
    sed -i "s|^$key=.*|$key=$escaped_value|" "$file"
}

# --- Strapi ---
if [ -f "strapi/.env.reference" ]; then
    cp strapi/.env.reference strapi/.env
    update_env_key "strapi/.env" "NODE_ENV" "production"
    update_env_key "strapi/.env" "DATABASE_USERNAME" "$DB_USER"
    update_env_key "strapi/.env" "DATABASE_PASSWORD" "$DB_PASSWORD"
    update_env_key "strapi/.env" "JWT_SECRET" "$GLOBAL_JWT_SECRET"
    update_env_key "strapi/.env" "API_TOKEN_SALT" "$GLOBAL_API_TOKEN_SALT"
    update_env_key "strapi/.env" "ADMIN_JWT_SECRET" "$(generate_secret)"
    update_env_key "strapi/.env" "APP_KEYS" "$(generate_secret),$(generate_secret),$(generate_secret),$(generate_secret)"
    update_env_key "strapi/.env" "TRANSFER_TOKEN_SALT" "$(generate_secret)"
    chown $ACTUAL_USER:$ACTUAL_USER strapi/.env
    echo_success "strapi/.env configured"
fi

# --- Web ---
if [ -f "web/.env.reference" ]; then
    cp web/.env.reference web/.env.local
    # Shared keys if any?
    # Web mostly uses public keys, but NEXTAUTH_SECRET needs to be set
    update_env_key "web/.env.local" "NEXTAUTH_SECRET" "$(generate_secret)"
    chown $ACTUAL_USER:$ACTUAL_USER web/.env.local
    echo_success "web/.env.local configured"
fi

# --- AI Service ---
if [ -f "ai-service/.env.reference" ]; then
    cp ai-service/.env.reference ai-service/.env
    update_env_key "ai-service/.env" "DATABASE_URL" "postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
    update_env_key "ai-service/.env" "STRAPI_API_TOKEN" "$STRAPI_API_TOKEN" # This needs to be synced manually or seeded
    chown $ACTUAL_USER:$ACTUAL_USER ai-service/.env
    echo_success "ai-service/.env configured"
fi

# --- Mebbis Service ---
if [ -f "mebbis-service/.env.reference" ]; then
    cp mebbis-service/.env.reference mebbis-service/.env
    update_env_key "mebbis-service/.env" "STRAPI_API_TOKEN" "$STRAPI_API_TOKEN"
    chown $ACTUAL_USER:$ACTUAL_USER mebbis-service/.env
    echo_success "mebbis-service/.env configured"
fi

#########################################################
# 12. Build Production Assets
#########################################################
echo_step "Building production assets..."

if [ -d "strapi" ]; then
    cd strapi
    echo_step "Building Strapi..."
    sudo -u $ACTUAL_USER NODE_ENV=production npm run build
    cd ..
fi

if [ -d "web" ]; then
    cd web
    echo_step "Building Web..."
    sudo -u $ACTUAL_USER navbar_title="Arkadas" npm run build
    cd ..
fi

#########################################################
# 13. PM2 Configuration
#########################################################
echo_step "Configuring PM2..."
cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [
    {
      name: 'strapi',
      cwd: './strapi',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 1337
      }
    },
    {
      name: 'web',
      cwd: './web',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'mebbis-service',
      cwd: './mebbis-service',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    },
    {
      name: 'ai-service',
      cwd: './ai-service',
      script: './venv/bin/uvicorn',
      args: 'app.main:app --host 0.0.0.0 --port 8000',
      interpreter: 'none'
    }
  ]
};
EOF
chown $ACTUAL_USER:$ACTUAL_USER ecosystem.config.js

#########################################################
# 14. NGINX Configuration
#########################################################
echo_step "Configuring NGINX..."
cat > /etc/nginx/sites-available/arkadas-erp <<'EOF'
upstream web_backend { server 127.0.0.1:3000; }
upstream strapi_backend { server 127.0.0.1:1337; }
upstream ai_backend { server 127.0.0.1:8000; }
upstream mebbis_backend { server 127.0.0.1:4000; }

server {
    listen 80;
    server_name _;

    client_max_body_size 100M;

    location / {
        proxy_pass http://web_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /strapi/ {
        rewrite ^/strapi/(.*) /$1 break;
        proxy_pass http://strapi_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    location /api/ {
        proxy_pass http://strapi_backend/api/;
        proxy_set_header Host $host;
    }

    location /ai/ {
        rewrite ^/ai/(.*) /$1 break;
        proxy_pass http://ai_backend;
        proxy_read_timeout 300s;
    }

    location /mebbis/ {
        rewrite ^/mebbis/(.*) /$1 break;
        proxy_pass http://mebbis_backend;
    }
}
EOF

ln -sf /etc/nginx/sites-available/arkadas-erp /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

#########################################################
# 15. Firewall
#########################################################
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'

echo_success "Setup Complete! 🚀"
echo "Generated DB Password: $DB_PASSWORD"
echo "Please verify .env files in $APP_DIR"
