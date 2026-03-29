# Arkadaş ERP - Makefile
# Common development commands

.PHONY: help dev build start stop reset test lint clean backup restore monitoring scan

# Default target
help:
	@echo "Arkadaş ERP - Available Commands"
	@echo "================================"
	@echo ""
	@echo "Development:"
	@echo "  make dev          Start development environment"
	@echo "  make build        Build all services"
	@echo "  make start        Start production services"
	@echo "  make stop         Stop all services"
	@echo ""
	@echo "Database:"
	@echo "  make reset        Full reset (WARNING: wipes data)"
	@echo "  make backup       Create backup"
	@echo "  make restore      Restore from backup"
	@echo ""
	@echo "Testing:"
	@echo "  make test         Run all tests"
	@echo "  make lint         Run linters"
	@echo "  make scan         Security scan (Docker Scout)"
	@echo ""
	@echo "Monitoring:"
	@echo "  make monitoring   Start monitoring stack"
	@echo "  make monitoring-stop  Stop monitoring stack"
	@echo ""
	@echo "Automation & Messaging:"
	@echo "  make automation   Start n8n & Chatwoot"
	@echo "  make automation-stop Stop automation stack"
	@echo ""
	@echo "PBX (Communication):"
	@echo "  make pbx-up       Start FreePBX/Asterisk"
	@echo "  make pbx-down     Stop FreePBX stack"
	@echo "  make pbx-logs     View PBX logs"
	@echo ""
	@echo "Storage Management:"
	@echo "  make storage-maintenance Run automatic data cleanup (retention policy)"
	@echo ""
	@echo "Backup System:"
	@echo "  make backup       Create manual backup (host)"
	@echo "  make backup-up    Start backup scheduler (cron + restic)"
	@echo "  make backup-down  Stop backup scheduler"
	@echo "  make restore      Restore from backup"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean        Clean build artifacts"
	@echo "  make logs         View logs"

# Development
dev:
	npm run dev

build:
	npm run build

start:
	npm run start

stop:
	npm run stop

# Database
reset:
	npm run reset

backup:
	bash scripts/backup.sh

backup-up:
	docker compose -f docker/docker-compose.backup.yml up -d --build

backup-down:
	docker compose -f docker/docker-compose.backup.yml down

restore:
	@read -p "Enter timestamp (e.g., 20260121_120000): " ts; \
	bash scripts/restore.sh --timestamp $$ts

seed:
	cd strapi && node scripts/seed.js

# Testing
test:
	npm run test

lint:
	npm run lint

typecheck:
	npm run typecheck

# Security
scan:
	npm run scan

scan-cves:
	npm run scan:cves

# Monitoring
monitoring:
	npm run monitoring:up
	@echo ""
	@echo "Monitoring URLs:"
	@echo "  Prometheus:   http://localhost:9090"
	@echo "  Grafana:      http://localhost:3001 (admin/admin)"
	@echo "  Alertmanager: http://localhost:9093"

monitoring-stop:
	npm run monitoring:down

# Automation
automation:
	docker compose -f docker-compose.yml -f docker/docker-compose.automation.yml up -d

automation-stop:
	docker compose -f docker-compose.yml -f docker/docker-compose.automation.yml down

# PBX
pbx-up:
	docker compose -f docker/docker-compose.pbx.yml up -d
	@echo ""
	@echo "PBX Admin: http://localhost:81"

pbx-down:
	docker compose -f docker/docker-compose.pbx.yml down

pbx-logs:
	docker compose -f docker/docker-compose.pbx.yml logs -f

# Storage Management
storage-maintenance:
	bash scripts/storage_maintenance.sh

# Logs
logs:
	docker compose logs -f

logs-strapi:
	docker compose logs -f strapi

# Traefik
traefik-up:
	docker compose -f docker/docker-compose.traefik.yml up -d

traefik-down:
	docker compose -f docker/docker-compose.traefik.yml down

traefik-logs:
	docker compose -f docker/docker-compose.traefik.yml logs -f

# Docker
docker-build:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-ps:
	docker compose ps

# Clean
clean:
	npm run clean
	rm -rf node_modules/.cache
	rm -rf strapi/dist strapi/build

clean-all: clean
	docker compose down -v
	sudo rm -rf infra_data/postgres infra_data/redis

setup-profile:
	@echo "" >> ~/.bashrc
	@echo "# Gemini Dev Automation alias" >> ~/.bashrc
	@echo "alias dev-chrome='google-chrome --remote-debugging-port=9222 --user-data-dir=\$$HOME/.chrome-dev-profile'" >> ~/.bashrc
	@echo "" >> ~/.bashrc
	@echo "# Ensure NVM defaults to Node 24" >> ~/.bashrc
	@echo "nvm use 24 > /dev/null 2>&1" >> ~/.bashrc
	@echo "✅ Profile updated. Please run 'source ~/.bashrc' to apply changes."

setup-tools:
	@mkdir -p ~/.gemini
	@touch ~/.gemini/tools.yaml
	@ln -sf ~/.gemini/tools.yaml ./tools.yaml
	@echo "✅ Local tools.yaml linked to ~/.gemini/tools.yaml"

