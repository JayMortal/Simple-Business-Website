#!/bin/bash
# ============================================================
# Simple-Business-Websitebuilder — Bare-Metal Deploy Script
# 裸机部署脚本（Nginx + PHP-FPM）
# ============================================================
# Usage / 用法:
#   bash deploy.sh example.com          # HTTP only
#   bash deploy.sh example.com --ssl    # HTTP + HTTPS (Let's Encrypt)
# ============================================================

set -e

DOMAIN=${1:-"your-domain.com"}
ENABLE_SSL=${2:-""}
SITE_DIR="/var/www/globaltrade"
NGINX_CONF="/etc/nginx/sites-available/globaltrade"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════╗"
echo "║   Simple-Business-Websitebuilder  Deploy v0.1   ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Run with root privileges / 请使用 root 权限运行：${NC}"
  echo "   sudo bash deploy.sh $DOMAIN"
  exit 1
fi

echo -e "${YELLOW}Domain / 域名:     $DOMAIN${NC}"
echo -e "${YELLOW}Directory / 目录:  $SITE_DIR${NC}"
echo -e "${YELLOW}SSL:               ${ENABLE_SSL:-(skipped / 跳过)}${NC}"
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# [1/7] Update packages
echo -e "${BLUE}[1/7] Updating packages / 更新系统包...${NC}"
apt-get update -qq

# [2/7] Install Nginx
echo -e "${BLUE}[2/7] Installing Nginx / 安装 Nginx...${NC}"
if ! command -v nginx &>/dev/null; then
  apt-get install -y nginx
fi
echo -e "${GREEN}✅ Nginx ready / 就绪${NC}"

# [3/7] Install PHP-FPM
echo -e "${BLUE}[3/7] Installing PHP-FPM / 安装 PHP-FPM...${NC}"
if ! command -v php &>/dev/null; then
  apt-get install -y php-fpm php-json
fi
PHP_SOCK=$(find /var/run/php/ -name "php*-fpm.sock" 2>/dev/null | head -1)
[ -z "$PHP_SOCK" ] && PHP_SOCK="/var/run/php/php-fpm.sock"
echo -e "${GREEN}✅ PHP-FPM ready / 就绪 (socket: $PHP_SOCK)${NC}"

# [4/7] Deploy files
echo -e "${BLUE}[4/7] Deploying files / 部署文件...${NC}"
mkdir -p "$SITE_DIR"
cp -r "$SCRIPT_DIR"/*.html "$SITE_DIR/"
cp -r "$SCRIPT_DIR"/*.php  "$SITE_DIR/" 2>/dev/null || true
cp -r "$SCRIPT_DIR"/css    "$SITE_DIR/"
cp -r "$SCRIPT_DIR"/js     "$SITE_DIR/"
[ -d "$SCRIPT_DIR/images" ] && cp -r "$SCRIPT_DIR"/images "$SITE_DIR/"

# Create data files only if they don't exist (preserve existing data on re-deploy)
[ ! -f "$SITE_DIR/site-data.json" ] && echo '{}' > "$SITE_DIR/site-data.json"
[ ! -f "$SITE_DIR/api-state.json" ] && echo '{}' > "$SITE_DIR/api-state.json"

# www-data (UID 33) must be able to write these files
chown -R www-data:www-data "$SITE_DIR"
chmod -R 755 "$SITE_DIR"
chmod 664 "$SITE_DIR/site-data.json" "$SITE_DIR/api-state.json"
echo -e "${GREEN}✅ Files deployed, permissions set / 文件已部署，权限已配置${NC}"

# [5/7] Configure Nginx
echo -e "${BLUE}[5/7] Configuring Nginx / 配置 Nginx...${NC}"
cat > "$NGINX_CONF" << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    root $SITE_DIR;
    index index.html;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
    gzip_min_length 1000;

    location ~* \.(jpg|jpeg|png|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    location ~* \.(css|js)$ {
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }

    # PHP — only api.php is executable
    location = /api.php {
        fastcgi_pass unix:$PHP_SOCK;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
    }

    # Block direct access to data files
    location ~* \.(json)$ { deny all; return 403; }

    location / { try_files \$uri \$uri/ \$uri.html =404; }

    # Optional: restrict admin by IP (uncomment and set your IP)
    # location = /admin.html {
    #     allow YOUR.IP.ADDRESS;
    #     deny all;
    # }

    error_page 404 /index.html;
    access_log /var/log/nginx/globaltrade_access.log;
    error_log  /var/log/nginx/globaltrade_error.log;
}
EOF

ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/globaltrade 2>/dev/null || true
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
nginx -t && systemctl reload nginx
echo -e "${GREEN}✅ Nginx configured / 配置完成${NC}"

# [6/7] Firewall
echo -e "${BLUE}[6/7] Configuring firewall / 配置防火墙...${NC}"
if command -v ufw &>/dev/null; then
  ufw allow 80/tcp; ufw allow 443/tcp; ufw allow 22/tcp
  echo -e "${GREEN}✅ Firewall rules set / 防火墙规则已配置${NC}"
else
  echo -e "${YELLOW}⚠ UFW not found — please open ports 80/443 manually / UFW 未找到，请手动开放 80/443 端口${NC}"
fi

# [7/7] SSL
echo -e "${BLUE}[7/7] SSL certificate / SSL 证书...${NC}"
if [ "$ENABLE_SSL" = "--ssl" ]; then
  if ! command -v certbot &>/dev/null; then
    apt-get install -y certbot python3-certbot-nginx
  fi
  certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN" --redirect
  echo -e "${GREEN}✅ HTTPS enabled / HTTPS 已启用${NC}"
else
  echo -e "${YELLOW}⚠ SSL skipped. To enable later / 跳过 SSL，如需启用：${NC}"
  echo "   certbot --nginx -d $DOMAIN"
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           🎉 Deployment complete! / 部署完成！   ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  🌐 Website / 网站:    ${BLUE}http://$DOMAIN${NC}"
echo -e "  ⚙  Admin / 后台:      ${BLUE}http://$DOMAIN/admin.html${NC}"
echo -e "  🔑 Default password / 默认密码: ${YELLOW}admin123${NC}"
echo -e "     ${RED}→ Change this immediately after first login!${NC}"
echo -e "     ${RED}→ 登录后请立即修改密码！${NC}"
echo ""
