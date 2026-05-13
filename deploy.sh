#!/bin/bash
# ============================================================
# GlobalTrade Website - One-Click VPS Deploy Script v4
# ============================================================
# Usage: bash deploy.sh [domain] [--ssl]
# Example: bash deploy.sh example.com --ssl
#
# Installs: Nginx + PHP-FPM (required for api.php backend)
# ============================================================

set -e

# ===== CONFIG =====
DOMAIN=${1:-"your-domain.com"}
ENABLE_SSL=${2:-""}
SITE_DIR="/var/www/globaltrade"
NGINX_CONF="/etc/nginx/sites-available/globaltrade"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════╗"
echo "║   GlobalTrade Website Deployment v4.0    ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# ===== CHECK ROOT =====
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ 请使用 root 权限运行：sudo bash deploy.sh${NC}"
  exit 1
fi

echo -e "${YELLOW}📋 配置信息：${NC}"
echo "   域名: $DOMAIN"
echo "   网站目录: $SITE_DIR"
echo "   SSL: ${ENABLE_SSL:-(跳过，稍后可手动执行)}"
echo ""

# ===== STEP 1: Update System =====
echo -e "${BLUE}[1/7] 更新系统包...${NC}"
apt-get update -qq

# ===== STEP 2: Install Nginx =====
echo -e "${BLUE}[2/7] 安装 Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
  apt-get install -y nginx
  echo -e "${GREEN}✅ Nginx 安装完成${NC}"
else
  echo -e "${GREEN}✅ Nginx 已存在，跳过安装${NC}"
fi

# ===== STEP 3: Install PHP-FPM (required for api.php) =====
echo -e "${BLUE}[3/7] 安装 PHP-FPM...${NC}"
if ! command -v php &> /dev/null; then
  apt-get install -y php-fpm php-json
  echo -e "${GREEN}✅ PHP-FPM 安装完成${NC}"
else
  echo -e "${GREEN}✅ PHP 已存在，跳过安装${NC}"
fi

# Detect PHP-FPM socket path (varies by PHP version)
PHP_SOCK=$(find /var/run/php/ -name "php*-fpm.sock" 2>/dev/null | head -1)
if [ -z "$PHP_SOCK" ]; then
  PHP_SOCK="/var/run/php/php-fpm.sock"
fi
echo "   PHP-FPM socket: $PHP_SOCK"

# ===== STEP 4: Copy Site Files =====
echo -e "${BLUE}[4/7] 部署网站文件...${NC}"
mkdir -p "$SITE_DIR"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Copy all website files
cp -r "$SCRIPT_DIR"/*.html "$SITE_DIR/"
cp -r "$SCRIPT_DIR"/*.php  "$SITE_DIR/" 2>/dev/null || true
cp -r "$SCRIPT_DIR"/css    "$SITE_DIR/"
cp -r "$SCRIPT_DIR"/js     "$SITE_DIR/"
[ -d "$SCRIPT_DIR/images" ] && cp -r "$SCRIPT_DIR"/images "$SITE_DIR/"

# Create data files if they don't exist (preserve existing data on re-deploy)
[ ! -f "$SITE_DIR/site-data.json"  ] && echo '{}' > "$SITE_DIR/site-data.json"
[ ! -f "$SITE_DIR/api-state.json"  ] && echo '{}' > "$SITE_DIR/api-state.json"

# Set permissions: www-data owns everything; data files are writable by web server
chown -R www-data:www-data "$SITE_DIR"
chmod -R 755 "$SITE_DIR"
chmod 660 "$SITE_DIR/site-data.json" "$SITE_DIR/api-state.json"

echo -e "${GREEN}✅ 网站文件部署完成 → $SITE_DIR${NC}"

# ===== STEP 5: Configure Nginx =====
echo -e "${BLUE}[5/7] 配置 Nginx (含 PHP 支持)...${NC}"

cat > "$NGINX_CONF" << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    root $SITE_DIR;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
    gzip_min_length 1000;

    # Cache static assets (JS/CSS get short cache so admin edits propagate quickly)
    location ~* \.(jpg|jpeg|png|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    location ~* \.(css|js)$ {
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }

    # PHP — only api.php is executable; block all other .php files for security
    location = /api.php {
        fastcgi_pass unix:$PHP_SOCK;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
    }

    # Block direct access to data files
    location ~ \.(json)$ {
        deny all;
        return 403;
    }

    # Main routing
    location / {
        try_files \$uri \$uri/ \$uri.html =404;
    }

    # Optional: restrict admin.html by IP (uncomment and set your IP)
    # location = /admin.html {
    #     allow YOUR.IP.ADDRESS.HERE;
    #     deny all;
    # }

    # Custom error pages
    error_page 404 /index.html;
    error_page 500 502 503 504 /index.html;

    # Log files
    access_log /var/log/nginx/globaltrade_access.log;
    error_log /var/log/nginx/globaltrade_error.log;
}
EOF

ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/globaltrade 2>/dev/null || true
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

nginx -t && systemctl reload nginx

echo -e "${GREEN}✅ Nginx 配置完成${NC}"

# ===== STEP 6: Firewall =====
echo -e "${BLUE}[6/7] 配置防火墙...${NC}"
if command -v ufw &> /dev/null; then
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw allow 22/tcp
  echo -e "${GREEN}✅ UFW 防火墙规则已配置${NC}"
else
  echo -e "${YELLOW}⚠ UFW 未安装，请手动配置防火墙开放 80/443 端口${NC}"
fi

# ===== STEP 7: SSL (optional) =====
echo -e "${BLUE}[7/7] SSL 证书...${NC}"
if [ "$ENABLE_SSL" = "--ssl" ]; then
  echo "正在安装 Certbot (Let's Encrypt)..."
  if ! command -v certbot &> /dev/null; then
    apt-get install -y certbot python3-certbot-nginx
  fi
  certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN" --redirect
  echo -e "${GREEN}✅ SSL 证书已配置${NC}"
else
  echo -e "${YELLOW}⚠ 跳过 SSL。如需启用，请运行：${NC}"
  echo "   certbot --nginx -d $DOMAIN -d www.$DOMAIN"
fi

# ===== DONE =====
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        🎉 部署完成！                     ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  🌐 网站地址：${BLUE}http://$DOMAIN${NC}"
echo -e "  ⚙  管理后台：${BLUE}http://$DOMAIN/admin.html${NC}"
echo -e "  🔑 默认密码：${YELLOW}admin123${NC}（请登录后立即修改）"
echo -e "  📁 网站目录：$SITE_DIR"
echo -e "  🗄  数据文件：$SITE_DIR/site-data.json"
echo ""
echo -e "${YELLOW}⚠ 安全提醒：${NC}"
echo -e "   1. 登录管理后台后请立即修改默认密码"
echo -e "   2. 强烈建议启用 HTTPS（加 --ssl 参数）"
echo -e "   3. 可在 Nginx 配置中为 /admin.html 加 IP 白名单"
echo ""
