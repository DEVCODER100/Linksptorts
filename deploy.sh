#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  LinkSports — Deploy latest code from GitHub
#  Run on the VPS after setup-vps.sh:
#    bash deploy.sh
# ─────────────────────────────────────────────────────────────
set -e

APP_DIR="/var/www/linksports"
GREEN='\033[0;32m'; NC='\033[0m'
log() { echo -e "${GREEN}[✓]${NC} $1"; }

echo ""
echo "=================================================="
echo "  LinkSports — Deploying latest..."
echo "=================================================="
echo ""

cd "$APP_DIR"
log "Pulling latest code..."
git pull origin main

log "Rebuilding backend..."
cd "$APP_DIR/backend"
npm install --silent
npm run build
pm2 restart linksports-backend

log "Rebuilding frontend..."
cd "$APP_DIR/frontend"
npm install --silent
npm run build
pm2 restart linksports-frontend

echo ""
echo "=================================================="
echo -e "  ${GREEN}Deploy complete!${NC}"
echo "=================================================="
pm2 list
