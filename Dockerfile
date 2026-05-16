# ── Simple-Business-Websitebuilder — Dockerfile ────────────────────
# Base: node:20-alpine (~60MB, replaces php:8.2-apache ~170MB)
# No database required. Data persisted via Docker volume on ./data/

FROM node:20-alpine

WORKDIR /app

# Install dependencies first (this layer is cached separately from source code,
# so rebuilding after code changes does NOT re-download npm packages)
COPY package*.json ./
RUN npm install --production --no-audit --no-fund

# Copy all source files
COPY . .

# Ensure data directory exists (the volume mount overlays it at runtime)
RUN mkdir -p data

EXPOSE 14514

CMD ["node", "server.js"]
