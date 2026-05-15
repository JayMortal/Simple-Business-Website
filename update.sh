#!/bin/bash
# ============================================================
# Simple-Business-Websitebuilder — One-Click Update Script
# 一键更新脚本
# ============================================================
# Usage / 用法: bash update.sh
#
# Safe: site-data.json and api-state.json are preserved.
# 安全：site-data.json 和 api-state.json 的数据不会丢失。
# ============================================================

set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════╗"
echo "║   Simple-Business-Websitebuilder  Updater v0.1  ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verify this is the right directory
if [ ! -f "docker-compose.yml" ] || [ ! -f "Dockerfile" ]; then
  echo -e "${RED}❌ Please run this script from the project root directory.${NC}"
  echo -e "${RED}   请在项目根目录下运行此脚本。${NC}"
  exit 1
fi

# [1/5] Pull latest code
echo -e "${BLUE}[1/5] Pulling latest code / 拉取最新代码...${NC}"
git pull
echo -e "${GREEN}✅ Code updated / 代码已更新${NC}"

# [2/5] Stop old container
echo -e "${BLUE}[2/5] Stopping old container / 停止旧容器...${NC}"
docker compose down
echo -e "${GREEN}✅ Container stopped / 旧容器已停止${NC}"

# [3/5] Rebuild image (no cache — ensures new code is used)
echo -e "${BLUE}[3/5] Rebuilding image (no cache) / 重新构建镜像（无缓存）...${NC}"
echo -e "${YELLOW}      This may take 1-3 minutes / 这可能需要 1-3 分钟...${NC}"
docker compose build --no-cache
echo -e "${GREEN}✅ Image rebuilt / 镜像构建完成${NC}"

# [4/5] Start new container
echo -e "${BLUE}[4/5] Starting new container / 启动新容器...${NC}"
docker compose up -d
echo -e "${GREEN}✅ Container started / 新容器已启动${NC}"

# [5/5] Clean up old images
echo -e "${BLUE}[5/5] Cleaning up old images / 清理旧镜像...${NC}"
docker image prune -f
echo -e "${GREEN}✅ Cleanup complete / 清理完成${NC}"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        🎉 Update complete! / 更新完成！          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}⚠ Cloudflare users / Cloudflare 用户:${NC}"
echo -e "  Go to CF Dashboard → Caching → Purge Everything"
echo -e "  前往 CF 控制台 → Caching → Purge Everything"
echo -e "  to clear CDN cache if the site still shows the old version."
echo -e "  如果页面仍显示旧版本，请清除 CDN 缓存。"
echo ""
