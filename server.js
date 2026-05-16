'use strict';
require('dotenv').config();

const express      = require('express');
const session      = require('express-session');
const rateLimit    = require('express-rate-limit');
const helmet       = require('helmet');
const bcrypt       = require('bcrypt');
const fs           = require('fs');
const path         = require('path');

const app  = express();
const PORT = parseInt(process.env.PORT || '14514', 10);

// ── File paths (persisted via Docker volume) ───────────────────────
const DATA_DIR   = path.join(__dirname, 'data');
const DATA_FILE  = path.join(DATA_DIR, 'site-data.json');
const STATE_FILE = path.join(DATA_DIR, 'admin-state.json');

// Ensure data directory exists on first run
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── State helpers ──────────────────────────────────────────────────
function readState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch { return {}; }
}
function writeState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), { flag: 'w' });
}

// Bootstrap default password hash on first run
function ensurePasswordHash(state) {
  if (!state.password_hash) {
    const initial = process.env.ADMIN_PASSWORD || 'admin123';
    state.password_hash = bcrypt.hashSync(initial, 10);
    writeState(state);
  }
}

// ── Security middleware ────────────────────────────────────────────
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,   // Allow inline scripts/styles used throughout the project
  crossOriginEmbedderPolicy: false
}));

// ── Session ───────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,          // Set true only when terminating TLS in Node (not needed behind Nginx)
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000   // 8 hours
  }
}));

// ── Body parser ───────────────────────────────────────────────────
app.use(express.json({ limit: '8mb' }));

// ── Block access to server-side files / data directory ───────────
app.use((req, res, next) => {
  const p = req.path.toLowerCase();
  const blocked = ['/data/', '/server.js', '/package.json', '/package-lock.json',
                   '/node_modules/', '/.env', '/admin-state.json'];
  if (blocked.some(b => p === b || p.startsWith(b))) {
    return res.status(403).end();
  }
  next();
});

// ── Serve static files — HTML always no-cache ─────────────────────
// This is the root fix for "update container but browser shows old HTML"
app.use(express.static(__dirname, {
  index: 'index.html',
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else if (/\.(js|css)$/.test(filePath)) {
      // JS/CSS: validate on each request but allow reuse if unchanged (ETag)
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// ── Rate limiters ─────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res) {
    const remaining = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000);
    res.status(429).json({ error: 'locked', retry_after: remaining });
  }
});

// ── Auth middleware ───────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  res.status(401).json({ error: 'unauthenticated' });
}

// ── Content sanitisation (strip PHP tags and <script> blocks) ─────
function sanitise(value) {
  if (typeof value === 'string') {
    return value
      .replace(/<\?[\s\S]*?\?>/g, '')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  }
  if (Array.isArray(value))  return value.map(sanitise);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = sanitise(v);
    return out;
  }
  return value;
}

// ══════════════════════════════════════════════════════════════════
//  API Routes
// ══════════════════════════════════════════════════════════════════

// GET /api/data — public, returns site content
app.get('/api/data', (req, res) => {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);
    res.json(data);
  } catch {
    res.json({ status: 'empty' });
  }
});

// GET /api/check-auth — check session validity
app.get('/api/check-auth', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.authenticated) });
});

// POST /api/login
app.post('/api/login', loginLimiter, async (req, res) => {
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'missing_password' });

  const state = readState();
  ensurePasswordHash(state);

  // Server-side lockout
  const now = Date.now();
  if (state.locked_until && now < state.locked_until) {
    const remaining = Math.ceil((state.locked_until - now) / 1000);
    return res.status(429).json({ error: 'locked', retry_after: remaining });
  }

  const ok = await bcrypt.compare(password, state.password_hash);
  if (!ok) {
    state.attempts = (state.attempts || 0) + 1;
    if (state.attempts >= 5) {
      state.locked_until = now + 15 * 60 * 1000;
      state.attempts = 0;
    }
    writeState(state);
    const remaining = 5 - (state.attempts || 0);
    return res.status(401).json({ error: 'wrong_password', remaining: Math.max(0, remaining) });
  }

  // Success — start session
  state.attempts = 0;
  state.locked_until = 0;
  writeState(state);

  req.session.authenticated = true;
  req.session.save(err => {
    if (err) return res.status(500).json({ error: 'session_error' });
    res.json({ status: 'ok' });
  });
});

// POST /api/logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ status: 'ok' }));
});

// POST /api/save — requires auth
app.post('/api/save', requireAuth, (req, res) => {
  const { data } = req.body || {};
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'missing_data' });
  }
  const clean = sanitise(data);
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(clean, null, 2), { flag: 'w' });
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Write failed:', err.message);
    res.status(500).json({ error: 'write_failed' });
  }
});

// POST /api/change-password — requires auth
app.post('/api/change-password', requireAuth, async (req, res) => {
  const { current, newPassword } = req.body || {};
  if (!current || !newPassword) {
    return res.status(400).json({ error: 'missing_fields' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'password_too_short' });
  }

  const state = readState();
  ensurePasswordHash(state);

  const ok = await bcrypt.compare(current, state.password_hash);
  if (!ok) return res.status(403).json({ error: 'wrong_current_password' });

  state.password_hash = await bcrypt.hash(newPassword, 10);
  writeState(state);

  // Invalidate session — admin must re-login
  req.session.destroy(() => res.json({ status: 'ok' }));
});

// ── Start server ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Simple-Business-Websitebuilder] Server running on http://localhost:${PORT}`);
  console.log(`[Simple-Business-Websitebuilder] Admin panel: http://localhost:${PORT}/admin.html`);
});
