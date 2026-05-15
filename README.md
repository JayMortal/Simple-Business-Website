# Simple-Business-Websitebuilder

> 🌐 [中文文档](README_CN.md) | **English**

A lightweight, self-hosted website builder for small businesses — bilingual (Chinese / English), visual admin panel, real-time editor, no database required.

**Live Demo:** [demo.yjggfun.com](https://demo.yjggfun.com)

---

## ✨ Features

| Feature | Detail |
|---------|--------|
| 🌐 Bilingual | Chinese / English — auto-detects visitor language |
| ✏️ Visual Editor | Click any text or image to edit directly on the page |
| 🗂 Sidebar Editor | Real-time panel — see changes live as you type |
| ⚙️ Admin Panel | Full content management at `/admin.html` |
| 🔘 Button Manager | Set each button: page jump / email / external link |
| 🎨 Theme Colors | Color picker + 6 preset schemes |
| 🔒 Secure Login | bcrypt password + session tokens + brute-force lockout |
| 🐳 Docker Ready | One-command deploy, works alongside 1Panel / aaPanel |
| 📦 No Database | All data stored in a single `site-data.json` file |

---

## 📁 Project Structure

```
Simple-Business-Websitebuilder/
├── index.html            # Home page
├── products.html         # Products (all categories shown vertically)
├── about.html            # About Us
├── contact.html          # Contact Us
├── admin.html            # Admin panel (/admin.html)
├── api.php               # Backend API — persistent storage & auth
├── css/
│   ├── style.css
│   └── admin.css
├── js/
│   ├── i18n.js           # Bilingual logic + auto language detection
│   ├── main.js           # Core logic, edit mode, server sync
│   ├── admin.js          # Admin panel logic
│   ├── btn-actions.js    # Button action manager
│   ├── sidebar-editor.js # Real-time sidebar editor
│   ├── products-data.js  # Product data store
│   └── products.js       # Products page rendering
├── Dockerfile
├── docker-compose.yml
├── deploy.sh             # Bare-metal deploy (Nginx + PHP-FPM)
├── update.sh             # One-click Docker update script
├── README.md             # This file
└── README_CN.md          # Chinese documentation
```

---

## 🐳 Option A — Docker Deploy (Recommended for 1Panel / aaPanel)

Panel tools occupy ports 80/443 with their own Nginx. Docker keeps this site fully isolated; the panel's reverse proxy handles external traffic.

### Prerequisites

```bash
# Install Docker (skip if already installed)
curl -fsSL https://get.docker.com | sh

# Install Docker Compose plugin (skip if already installed)
apt-get install -y docker-compose-plugin
```

### Step 1 — Clone & Initialise

```bash
# Clone into your panel's app directory
git clone https://github.com/JayMortal/Simple-Business-Websitebuilder.git \
  /opt/1panel/apps/Simple-Business-Websitebuilder
cd /opt/1panel/apps/Simple-Business-Websitebuilder

# Create data files and set permissions (www-data UID = 33)
mkdir -p data
echo '{}' > data/site-data.json
echo '{}' > data/api-state.json
chown 33:33 data/site-data.json data/api-state.json
chmod 664   data/site-data.json data/api-state.json
```

> **Why `chown 33:33`?** The Apache process inside the container runs as `www-data` (UID 33). Without this, `api.php` cannot write to the data files and all admin changes will fail to sync.

### Step 2 — Start the Container

```bash
docker compose up -d --build
```

### Step 3 — Configure Reverse Proxy in Your Panel

**1Panel example:**
1. Website → Create → **Reverse Proxy**
2. Domain: `yourdomain.com`
3. Proxy target: `http://127.0.0.1:14514`
4. Apply SSL via the panel's built-in Let's Encrypt button

Same principle applies to aaPanel, BT Panel, and similar tools.

### Step 4 — Verify

| URL | Expected result |
|-----|----------------|
| `https://yourdomain.com` | Home page loads |
| `https://yourdomain.com/admin.html` | Login screen appears |
| Login with `admin123` | Admin panel opens |
| Edit any text, click Save | ✅ "Saved & synced" toast — change visible to all visitors |

---

## 🖥 Option B — Bare-Metal Deploy (Nginx + PHP-FPM)

For servers **without** Docker or a panel. One script does everything.

```bash
git clone https://github.com/JayMortal/Simple-Business-Websitebuilder.git
cd Simple-Business-Websitebuilder
chmod +x deploy.sh

# HTTP only
bash deploy.sh yourdomain.com

# HTTP + HTTPS (Let's Encrypt)
bash deploy.sh yourdomain.com --ssl
```

The script automatically installs Nginx + PHP-FPM, copies all files, sets the correct write permissions on `site-data.json` and `api-state.json`, and configures the Nginx server block.

---

## 🔄 Updating (Docker)

Use the included `update.sh` — it preserves all your data:

```bash
cd /opt/1panel/apps/Simple-Business-Websitebuilder
bash update.sh
```

**What it does:** `git pull` → stop old container → rebuild image with `--no-cache` → start new container → prune old images.

> ⚠️ **Cloudflare users:** After updating, go to CF Dashboard → Caching → **Purge Everything** to clear CDN cache. To avoid this in future, add a Cache Rule to **Bypass cache** for `*.js` and `*.css` files.

---

## ⚙️ Admin Panel Guide

### Step 1 — Set the Site Default Language

Go to **Site Settings** and choose how first-time visitors see the site:

| Option | Behaviour |
|--------|-----------|
| 🌍 Auto-detect *(recommended)* | Chinese browser → Chinese; all others → English |
| 🇨🇳 Chinese | All first-time visitors see Chinese |
| 🇬🇧 English | All first-time visitors see English |

Visitors who manually switch the language will always see their chosen language on return visits.

### Step 2 — Edit Bilingual Content

The left sidebar has two independent language controls:

```
🌐 UI Language      [中文] [English]   ← language of the admin interface itself
✏️ Edit Language    [中文] [English]   ← which language's front-end content you're editing
```

**Recommended workflow:**
1. Set Edit Language → **中文** → fill in all Chinese content → **Save**
2. Set Edit Language → **English** → fill in all English content → **Save**
3. Front-end visitors automatically see content in the correct language

### Step 3 — Change the Admin Password

Admin Panel → left sidebar → **Change Password**. Do this immediately after first login.

### Data Backup & Restore

- **Export:** Site Settings → Export Data (downloads a `.json` backup)
- **Import:** Site Settings → Import Data (restores from a previous backup)
- **Reset:** Site Settings → Reset to Defaults (clears all custom content)

---

## 🔒 Security Notes

1. **Change the default password** `admin123` immediately after first login
2. **Always use HTTPS** — enable with the `--ssl` flag or via your panel
3. To restrict admin access by IP, uncomment the `allow` block in the Nginx config
4. Login is protected server-side: **5 failed attempts → 15-minute lockout**

---

## 📦 At a Glance

| Item | Detail |
|------|--------|
| Version | v0.1 |
| Backend | PHP 8.2, no database |
| Deploy options | Docker (recommended), Nginx + PHP-FPM (bare-metal) |
| Minimum server spec | 1 vCPU / 512 MB RAM |
| External dependencies | Google Fonts via CDN (optional) |

---

*[Simple-Business-Websitebuilder](https://github.com/JayMortal/Simple-Business-Websitebuilder) v0.1*
