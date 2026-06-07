#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  LinkSports — Hostinger VPS Full Setup Script
#  Run as root on a fresh Ubuntu 22.04 VPS:
#    bash setup-vps.sh
# ─────────────────────────────────────────────────────────────
set -e

DOMAIN="linksports.in"
API_DOMAIN="api.linksports.in"
REPO="https://github.com/Panwarhimanshu/LinkSports.git"
APP_DIR="/var/www/linksports"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

echo ""
echo "=================================================="
echo "  LinkSports VPS Setup"
echo "=================================================="
echo ""

# ── 1. System update ────────────────────────────────────────
log "Updating system packages..."
apt-get update -qq && apt-get upgrade -y -qq

# ── 2. Node.js 20 ───────────────────────────────────────────
log "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
apt-get install -y nodejs -qq

# ── 3. Tools ────────────────────────────────────────────────
log "Installing Nginx, Git, Certbot, PM2..."
apt-get install -y nginx git certbot python3-certbot-nginx -qq
npm install -g pm2 --silent

# ── 4. Clone repo ───────────────────────────────────────────
log "Cloning repository..."
mkdir -p /var/www
if [ -d "$APP_DIR" ]; then
  warn "Directory exists — pulling latest..."
  cd "$APP_DIR" && git pull origin main
else
  git clone "$REPO" "$APP_DIR"
fi

# ── 5. Backend .env ─────────────────────────────────────────
log "Creating backend .env..."
cat > "$APP_DIR/backend/.env" << 'ENVEOF'
NODE_ENV=production
PORT=5000

MONGODB_URI=mongodb+srv://panwarhimanshu4321_db_user:yr8U8yYbWEQNf4Es@ac-iu4obkk-shard-00-00.dwwpzpu.mongodb.net:27017,ac-iu4obkk-shard-00-01.dwwpzpu.mongodb.net:27017,ac-iu4obkk-shard-00-02.dwwpzpu.mongodb.net:27017/linksports?ssl=true&replicaSet=atlas-11b55e-shard-0&authSource=admin&retryWrites=true&w=majority

JWT_SECRET=linksports_jwt_secret_key_2026_very_long_and_secure
JWT_REFRESH_SECRET=linksports_refresh_secret_key_2026_very_long_and_secure
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=30d

CLIENT_URL=https://linksports.in

EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_USER=noreply@linksports.in
EMAIL_PASS=LinkSports@32q
EMAIL_FROM=LinkSports <noreply@linksports.in>

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

APP_NAME=LinkSports
APP_URL=https://linksports.in
ADMIN_EMAIL=admin@linksports.in
ENVEOF

# ── 6. Frontend .env ────────────────────────────────────────
log "Creating frontend .env.local..."
cat > "$APP_DIR/frontend/.env.local" << 'ENVEOF'
NEXT_PUBLIC_API_URL=https://api.linksports.in/api/v1
NEXT_PUBLIC_SOCKET_URL=https://api.linksports.in
NEXT_PUBLIC_APP_NAME=LinkSports
NEXT_PUBLIC_APP_URL=https://linksports.in
ENVEOF

# ── 7. Build backend ────────────────────────────────────────
log "Installing and building backend..."
cd "$APP_DIR/backend"
npm install --silent
npm run build

# ── 8. Build frontend ───────────────────────────────────────
log "Installing and building frontend (this takes a few minutes)..."
cd "$APP_DIR/frontend"
npm install --silent
npm run build

# ── 9. PM2 ──────────────────────────────────────────────────
log "Starting apps with PM2..."
pm2 delete linksports-backend 2>/dev/null || true
pm2 delete linksports-frontend 2>/dev/null || true

pm2 start "$APP_DIR/backend/dist/server.js" --name linksports-backend
pm2 start npm --name linksports-frontend -- --prefix "$APP_DIR/frontend" start

pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash || true

# ── 10. Nginx — backend ─────────────────────────────────────
log "Configuring Nginx for $API_DOMAIN..."
cat > /etc/nginx/sites-available/$API_DOMAIN << NGINXEOF
server {
    listen 80;
    server_name $API_DOMAIN;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        client_max_body_size 10M;
    }
}
NGINXEOF

# ── 11. Nginx — frontend ────────────────────────────────────
log "Configuring Nginx for $DOMAIN..."
cat > /etc/nginx/sites-available/$DOMAIN << NGINXEOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/$API_DOMAIN /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl reload nginx

# ── 12. SSL ─────────────────────────────────────────────────
log "Setting up SSL certificates..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN -d $API_DOMAIN \
  --non-interactive --agree-tos --email admin@linksports.in --redirect

# ── Done ────────────────────────────────────────────────────
echo ""
echo "=================================================="
echo -e "  ${GREEN}Setup Complete!${NC}"
echo "=================================================="
echo ""
echo "  Frontend: https://$DOMAIN"
echo "  Backend:  https://$API_DOMAIN/api/v1"
echo ""
echo "  pm2 list          — check running processes"
echo "  pm2 logs          — view live logs"
echo "  bash deploy.sh    — deploy future updates"
echo ""
