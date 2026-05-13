# ── GlobalTrade Website — Dockerfile ──────────────────────────────
# Base: php:8.2-apache (includes PHP + Apache in one image, ~170MB)
# No database needed. Data persisted via Docker volume on site-data.json

FROM php:8.2-apache

# Enable mod_rewrite (not strictly needed for static site but good practice)
RUN a2enmod rewrite

# Copy all website files into Apache's webroot
COPY . /var/www/html/

# Create the data files if they don't exist yet (volume mount may override these)
RUN touch /var/www/html/site-data.json \
    && touch /var/www/html/api-state.json

# Give Apache write access to the data files api.php needs to write
RUN chown www-data:www-data \
      /var/www/html/site-data.json \
      /var/www/html/api-state.json \
    && chmod 660 \
      /var/www/html/site-data.json \
      /var/www/html/api-state.json

# Optional: allow .htaccess overrides if you add one later
RUN sed -i 's/AllowOverride None/AllowOverride All/g' \
      /etc/apache2/apache2.conf

EXPOSE 80
