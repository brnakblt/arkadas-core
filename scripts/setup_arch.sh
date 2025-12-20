#!/bin/bash
#########################################################
# Arkadaş Özel Eğitim ERP - Arch Linux Setup Script
# Updated: 2025-12-13
# Run with: sudo ./setup_arch.sh
#########################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo_step() { echo -e "${BLUE}==>${NC} ${GREEN}$1${NC}"; }
echo_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
echo_error() { echo -e "${RED}❌ $1${NC}"; }
echo_success() { echo -e "${GREEN}✅ $1${NC}"; }

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     Arkadaş Özel Eğitim ERP - Arch Linux Setup            ║${NC}"
echo -e "${CYAN}║     Setting up development environment                    ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo_error "Please run as root (sudo ./setup_arch.sh)"
   exit 1
fi

# Get actual user
ACTUAL_USER="${SUDO_USER:-$USER}"

#########################################################
# 1. Update System
#########################################################
echo_step "Updating system..."
pacman -Syu --noconfirm
echo_success "System updated"

#########################################################
# 2. Install Base Development Tools
#########################################################
echo_step "Installing base development tools..."
pacman -S --needed --noconfirm \
    base-devel \
    git \
    curl \
    wget \
    unzip \
    cmake \
    gcc \
    make
echo_success "Base development tools installed"

#########################################################
# 3. Install Node.js (v22 LTS)
#########################################################
echo_step "Installing Node.js v22..."

# Install nvm for the user
if [ ! -d "/home/$ACTUAL_USER/.nvm" ]; then
    sudo -u $ACTUAL_USER bash <<'END_BASH'
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 22
nvm use 22
nvm alias default 22
END_BASH
    echo_success "Node.js v22 installed via nvm"
else
    echo_warn "nvm already installed, skipping"
fi

#########################################################
# 4. Install Python 3.11
#########################################################
echo_step "Installing Python 3.11..."
pacman -S --needed --noconfirm python python-pip python-virtualenv
echo_success "Python installed"

#########################################################
# 5. Install Docker and Docker Compose
#########################################################
echo_step "Installing Docker..."
pacman -S --needed --noconfirm docker docker-compose

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Add user to docker group
usermod -aG docker $ACTUAL_USER
echo_success "Docker installed and configured"

#########################################################
# 6. Install PostgreSQL
#########################################################
echo_step "Installing PostgreSQL..."
pacman -S --needed --noconfirm postgresql

# Initialize PostgreSQL
if [ ! -d "/var/lib/postgres/data" ]; then
    sudo -u postgres initdb -D /var/lib/postgres/data
    systemctl start postgresql
    systemctl enable postgresql
    
    # Create database and user
    sudo -u postgres psql <<EOF
CREATE DATABASE arkadas_erp;
CREATE USER strapi WITH ENCRYPTED PASSWORD 'strapi_dev_password';
GRANT ALL PRIVILEGES ON DATABASE arkadas_erp TO strapi;
ALTER DATABASE arkadas_erp OWNER TO strapi;
EOF
    echo_success "PostgreSQL configured"
else
    echo_warn "PostgreSQL already initialized, skipping"
fi

#########################################################
# 7. Install Redis
#########################################################
echo_step "Installing Redis..."
pacman -S --needed --noconfirm redis
systemctl start redis
systemctl enable redis
echo_success "Redis installed"

#########################################################
# 8. Install Build Tools for dlib
#########################################################
echo_step "Installing build tools for dlib..."
pacman -S --needed --noconfirm \
    cmake \
    boost \
    blas \
    lapack \
    openblas
echo_success "Build tools installed"

#########################################################
# 9. Setup Application Directory
#########################################################
echo_step "Setting up application directory..."
APP_DIR="/opt/arkadas-erp"

if [ ! -d "$APP_DIR" ]; then
    mkdir -p $APP_DIR
    chown -R $ACTUAL_USER:$ACTUAL_USER $APP_DIR
    echo_success "Application directory created: $APP_DIR"
else
    echo_warn "Application directory already exists"
fi

#########################################################
# 10. Install Project Dependencies
#########################################################
if [ -f "$APP_DIR/package.json" ]; then
    echo_step "Installing project dependencies..."
    cd $APP_DIR
    
    # Install as user
    sudo -u $ACTUAL_USER bash <<'END_BASH'
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Root dependencies
npm install

# Service dependencies
for dir in web strapi mobile mebbis-service; do
    if [ -d "$dir" ]; then
        echo "Installing $dir dependencies..."
        cd $dir
        npm install
        cd ..
    fi
done

# Install Playwright for MEBBIS
if [ -d "mebbis-service" ]; then
    cd mebbis-service
    npx playwright install chromium
    npx playwright install-deps
    cd ..
fi
END_BASH
    
    echo_success "Project dependencies installed"
else
    echo_warn "package.json not found in $APP_DIR"
fi

#########################################################
# 11. Setup Python AI Service
#########################################################
if [ -d "$APP_DIR/ai-service" ]; then
    echo_step "Setting up Python AI service..."
    cd "$APP_DIR/ai-service"
    
    sudo -u $ACTUAL_USER bash <<'END_BASH'
# Create virtual environment
python -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Install dlib (this may take time)
echo "Installing dlib (5-10 minutes)..."
pip install dlib

# Install face-recognition
pip install face-recognition

deactivate
END_BASH
    
    echo_success "Python AI service configured"
else
    echo_warn "ai-service directory not found"
fi

#########################################################
# 12. Create Helper Scripts
#########################################################
echo_step "Creating helper scripts..."

cat > /home/$ACTUAL_USER/start-dev.sh <<'END_SCRIPT'
#!/bin/bash

echo "Starting development servers..."

# Start infrastructure
echo "Starting Docker containers..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Navigate to project
cd /opt/arkadas-erp || exit

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Start all services
npm run dev:all

echo ""
echo "All services started!"
echo "- Strapi:      http://localhost:1337/admin"
echo "- Web:         http://localhost:3000"
echo "- AI API:      http://localhost:8000/docs"
echo "- MEBBIS API:  http://localhost:4000/api"
END_SCRIPT

chmod +x /home/$ACTUAL_USER/start-dev.sh
chown $ACTUAL_USER:$ACTUAL_USER /home/$ACTUAL_USER/start-dev.sh

echo_success "Helper script created: ~/start-dev.sh"

#########################################################
# Summary
#########################################################
echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    Setup Complete! 🎉                      ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📋 Next Steps:${NC}"
echo ""
echo "1. Log out and log back in (for docker group to take effect)"
echo "   Or run: newgrp docker"
echo ""
echo "2. Configure environment files:"
echo "   - $APP_DIR/strapi/.env (database credentials)"
echo "   - $APP_DIR/web/.env.local (Google Maps API key)"
echo "   - $APP_DIR/mebbis-service/.env (Redis URL, MEBBIS credentials)"
echo ""
echo "3. Start development servers:"
echo "   ~/start-dev.sh"
echo ""
echo "4. Access the applications:"
echo "   - Frontend:       http://localhost:3000"
echo "   - Strapi Admin:   http://localhost:1337/admin"
echo "   - AI API Docs:    http://localhost:8000/docs"
echo "   - MEBBIS API:     http://localhost:4000/api"
echo ""
echo -e "${GREEN}✅ Installed:${NC}"
echo "  - Node.js v22 (via nvm)"
echo "  - Python 3.11 with virtualenv"
echo "  - Docker & Docker Compose"
echo "  - PostgreSQL"
echo "  - Redis"
echo "  - dlib & face-recognition"
echo ""
echo_success "Happy coding! 🚀"
