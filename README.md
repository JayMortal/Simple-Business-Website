# Simple-Business-Websitebuilder

> 🌐 [中文文档](README_CN.md) | **English**

A fully-featured B2B trade website template with bilingual support (Chinese / English), a visual admin panel, real-time sidebar editor, and one-click Linux VPS deployment. Admin changes are persisted to the server via a lightweight PHP API — visible to all visitors with no database required.

---

## 📁 Project Structure

```
Simple-Business-Websitebuilder/
├── index.html            # Home page
├── products.html         # Products page (all categories shown vertically)
├── about.html            # About Us page
├── contact.html          # Contact Us page
├── admin.html            # Admin panel — access via /admin.html
├── api.php               # ★ Backend API: persistent storage, session token auth
├── css/
│   ├── style.css         # Main stylesheet + CSS theme variables
│   └── admin.css         # Admin panel stylesheet
├── js/
│   ├── i18n.js           # Bilingual switching (ZH / EN)
│   ├── main.js           # Core logic, edit mode, logo / favicon, theme, server sync
│   ├── btn-actions.js    # Button action manager (page jump / email / external URL)
│   ├── sidebar-editor.js # Real-time sidebar editor with live preview
│   ├── products-data.js  # Product data store
│   ├── products.js       # Products page rendering & management
│   └── admin.js          # Admin panel logic
├── Dockerfile            # Docker image build file
├── docker-compose.yml    # Docker Compose configuration
├── deploy.sh             # Bare-metal one-click deploy script (Nginx + PHP-FPM)
├── README.md             # This file (English)
└── README_CN.md          # Chinese documentation
```

---

## 🔑 How Data Persistence Works

`api.php` is the project's backend — ~120 lines of PHP, no database:

| Request | Purpose |
|---------|---------|
| GET `api.php` | Returns `site-data.json` (front-end pages read this on load) |
| POST `login` | Verifies bcrypt-hashed password, issues a timed session token |
| POST `save` | Validates token, writes full site state to `site-data.json` |
| POST `change_password` | Validates token, updates bcrypt hash, invalidates token |
| POST `logout` | Server-side token invalidation |

**Flow**: Admin logs in → server issues token → every save pushes data to server → visitors' browsers fetch the latest data from `api.php` on page load.

---

## 🚀 Option A: Bare-Metal Deploy (Nginx + PHP-FPM)

### Prerequisites

- Ubuntu 20.04 / 22.04 LTS (or a compatible Debian-based distro)
- `root` access to the server
- Domain name already pointed to the server's IP address

### Step 1 — Get the Code onto Your Server

**Option A: Clone from GitHub (recommended)**
```bash
git clone https://github.com/your-username/Simple-Business-Websitebuilder.git /root/Simple-Business-Websitebuilder
cd /root/Simple-Business-Websitebuilder
```

**Option B: Upload via SCP from your local machine**
```bash
scp -r ./Simple-Business-Websitebuilder root@your-server-ip:/root/
```

### Step 2 — Run the Deploy Script

```bash
cd /root/Simple-Business-Websitebuilder
chmod +x deploy.sh

# HTTP only
bash deploy.sh yourdomain.com

# HTTP + automatic HTTPS via Let's Encrypt
bash deploy.sh yourdomain.com --ssl
```

The script automatically:
- Installs Nginx and **PHP-FPM** (required to run `api.php`)
- Copies all site files to `/var/www/globaltrade/`
- Creates `site-data.json` and `api-state.json` with correct write permissions
- Writes an optimised Nginx config with PHP support and JSON file protection
- Opens firewall ports 80 and 443
- Optionally obtains and configures an SSL certificate

### Step 3 — Done!

| URL | Purpose |
|-----|---------|
| `http://yourdomain.com` | Public website |
| `http://yourdomain.com/admin.html` | Admin panel |
| Default password | `admin123` — **change this immediately after first login** |

---

## 🐳 Option B: Docker Deploy (recommended when 1Panel / aaPanel is already installed)

Panel tools typically occupy ports 80/443 and run their own Nginx/OpenResty, which can conflict with the bare-metal script. Docker isolates the site completely; the panel's reverse proxy feature handles external traffic.

### Prerequisites

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
apt-get install -y docker-compose-plugin
```

### Step 1 — Get the Code

```bash
git clone https://github.com/your-username/Simple-Business-Websitebuilder.git /root/Simple-Business-Websitebuilder
cd /root/Simple-Business-Websitebuilder
```

### Step 2 — Initialise Data Directory

```bash
mkdir -p data
echo '{}' > data/site-data.json
echo '{}' > data/api-state.json
```

### Step 3 — Start the Container

```bash
docker compose up -d --build
```

The container listens on port `14514` (change in `docker-compose.yml` if needed).

### Step 4 — Configure Reverse Proxy in Your Panel

**1Panel example:**
1. Website → Create → choose **Reverse Proxy**
2. Domain: your domain; Proxy target: `http://127.0.0.1:14514`
3. Apply SSL via the panel's built-in Let's Encrypt button

Other panels (aaPanel, BT Panel) work the same — create a reverse proxy site pointing to `127.0.0.1:14514`.

### Common Commands

```bash
docker compose ps          # status
docker compose logs -f     # live logs
docker compose down        # stop
git pull && docker compose up -d --build   # update code (data preserved)
```

> **Data persistence**: `site-data.json` and `api-state.json` are bind-mounted from `./data/` on the host. Rebuilding or restarting the container never touches these files.

---

## ✨ Features

### Pages

| Page | Content |
|------|---------|
| Home | Hero banner, stats bar, advantages section, featured products, CTA |
| Products | All categories displayed vertically; each with a full product grid |
| About Us | Company story, mission & values, team profiles, certifications |
| Contact | Contact info card, inquiry form, social media buttons |

### 🌐 Bilingual Support (Chinese / English)

- One-click language toggle in the top-right header on every page
- Language preference saved automatically via `localStorage`
- All admin fields support both Chinese and English input independently
- Product names, descriptions, and category names each have separate CN / EN fields

### ✏️ Inline Edit Mode

After logging into the admin panel, all front-end pages enter **edit mode**:
- Every text element becomes directly editable — click to type, changes save automatically
- Every image shows a click-to-replace overlay — paste a URL or upload a local file
- A floating toolbar at the bottom provides **Save**, **Sidebar Editor**, **Admin Panel**, and **Exit** controls

### 🗂 Real-Time Sidebar Editor

Click **"Sidebar Editor"** in the edit-mode toolbar to open a slide-in panel on the left:
- All editable fields for the current page are listed and grouped by section automatically
- Text changes appear instantly on the live page behind the panel
- Image fields support URL input, local upload, and instant thumbnail preview
- Language can be switched inside the panel
- **Save** and **Cancel** each require a confirmation dialog to prevent accidental changes

### ⚙️ Admin Panel (`/admin.html`)

| Section | What you can manage |
|---------|---------------------|
| Home | Hero text & background image, stats bar numbers, advantages, featured products, CTA |
| Products | Add / rename / delete categories (minimum 1); add / edit / delete products (minimum 1 per category); CN + EN content; image via URL or upload |
| About Us | Story text & image, mission / vision / values, team member profiles, certifications |
| Contact | Contact details, working hours, social media button labels |
| **Button Manager** | Per-button action: page jump (dropdown), send email (enter address only), external URL, or no action |
| Site Settings | Logo text, logo image (replaces text logo when set), browser favicon (independent setting), footer text |
| Theme Colors | Primary + accent color pickers, hex input, live gradient preview, 6 preset schemes |
| Change Password | Requires current password; minimum 6 characters |
| Data Management | Export all data as a JSON backup; import from JSON; reset everything to defaults |

### 🔘 Button Action Manager

Every configurable button can independently be set to one of four actions:

| Action | Behaviour |
|--------|-----------|
| 📄 Page Jump | Select a destination from a dropdown of existing pages — no URL typing required |
| ✉️ Send Email | Enter an email address; the button generates the `mailto:` link automatically |
| 🔗 External Link | Enter a full URL; opens in a new tab |
| 🚫 No Action | Decorative button with no click behaviour |

Buttons covered: Hero Button 1 & 2, "View All Products", CTA button, WeChat / LinkedIn / WhatsApp social buttons, and the inquiry form submit button.

### 🔒 Brute-Force Login Protection

- 5 consecutive failed password attempts lock the admin login for **15 minutes**
- A real-time countdown timer is displayed during the lockout period
- The login button is disabled while the account is locked
- The attempt counter resets automatically once the lockout expires

### 🎨 Theme Color Editor

- Color picker and hex input for both primary and accent colors
- Live gradient preview updates in real time as you choose
- Six built-in presets: Deep Ocean Gold (default), Midnight Red, Forest Orange, Corporate Blue, Tech Purple, Black & Green
- Colors are applied via CSS custom properties — the entire site updates after a page refresh

### 🖼 Logo & Favicon

- **Logo image**: upload an image to replace the default text logo on all pages
- **Browser favicon**: independent setting — can use a different image from the logo
- Clearing the logo image automatically restores the text logo

---

## 🔧 Customisation

### Change the Admin Password

Admin Panel → Change Password (in the left sidebar)

### Customise Theme Colors via Code

Edit the CSS variables at the top of `css/style.css`:

```css
:root {
  --navy: #0a1628;   /* Primary color — dark backgrounds (header, footer) */
  --gold: #c9a84c;   /* Accent color — buttons, highlights, decorations */
}
```

Or use the **Theme Colors** page in the admin panel — no code editing required.

### Data Persistence

All content is stored in the browser's `localStorage` (fully client-side, no server or database required).

- Use **Export Data** in the admin panel to download a JSON backup file
- Use **Import Data** to restore content on a new device or after clearing browser data
- For server-side persistence, integrate a lightweight Node.js or PHP endpoint to write the exported JSON to disk

---

## 📌 Nginx Configuration Notes

The deploy script writes `/etc/nginx/sites-available/globaltrade` with the following included:

- **Gzip compression** for CSS, JS, HTML, SVG, and JSON
- **30-day browser cache** for all static assets (`Cache-Control: public, immutable`)
- **Security headers**: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`
- **Commented-out IP allowlist** for `/admin.html` — uncomment to restrict admin access by IP address
- Access and error logs at `/var/log/nginx/globaltrade_access.log` and `globaltrade_error.log`

---

## 🔒 Security Recommendations

1. **Change the default password** `admin123` immediately after first login
2. Restrict `/admin.html` to trusted IP addresses by uncommenting the allowlist block in the Nginx config
3. Always serve the site over HTTPS — use the `--ssl` flag when running `deploy.sh`
4. Export and store a JSON data backup regularly via the admin panel

---

## 🔄 Updating the Site After Code Changes

```bash
# Local machine — commit and push
git add .
git commit -m "update: describe what changed"
git push

# VPS — pull and sync
ssh root@your-server-ip
cd /root/Simple-Business-Websitebuilder
git pull
cp -r *.html css js /var/www/globaltrade/
systemctl reload nginx
```

> **Tip:** To skip the manual `cp` step on every update, change `SITE_DIR` in `deploy.sh` to `/root/Simple-Business-Websitebuilder` before running it. Nginx will then serve files directly from the Git repository directory, so `git pull` alone is enough to update the live site.

---

## 📦 At a Glance

| Item | Detail |
|------|--------|
| Total files | 15 (7 HTML/CSS, 7 JS, 1 shell script) |
| Zip archive size | ~68 KB |
| External dependencies | Google Fonts via CDN (optional — can be self-hosted) |
| Backend required | None — 100% static files |
| Minimum server spec | 1 vCPU / 512 MB RAM (any basic VPS) |

---

*Built with ❤️ — [Simple-Business-Websitebuilder](https://github.com/your-username/Simple-Business-Websitebuilder) v0.1*
