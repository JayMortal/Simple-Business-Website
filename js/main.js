// ===== main.js v5 =====
// Changes:
//  - hydrateFromServerData: handles [] vs {} for editableImages/btnActions
//  - loadEditableContent: reads lang-prefixed keys (edit_zh_xxx / edit_en_xxx)
//  - applyImageEdit: saves to lang-prefixed key
//  - saveFrontChanges: saves per-lang keys then syncs
//  - langChanged event: re-renders page content on language switch

const ADMIN_SESSION_KEY = 'adminLoggedIn';
const API_TOKEN_KEY     = 'apiToken';

// ── Header scroll
const header = document.getElementById('siteHeader');
if (header) window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 30));

// ── Mobile menu
function toggleMobileMenu() {
  const nav = document.getElementById('mobileNav');
  if (nav) nav.classList.toggle('open');
}

// ── Admin helpers
function isAdminMode() { return localStorage.getItem(ADMIN_SESSION_KEY) === '1'; }
function getApiToken()  { return sessionStorage.getItem(API_TOKEN_KEY) || ''; }

// ── Theme colors
function applyThemeColors() {
  const primary = localStorage.getItem('theme.primary');
  const accent  = localStorage.getItem('theme.accent');
  if (primary) {
    document.documentElement.style.setProperty('--navy', primary);
    document.documentElement.style.setProperty('--navy-mid',   hexToRgba(primary, 0.85));
    document.documentElement.style.setProperty('--navy-light', hexToRgba(primary, 0.65));
  }
  if (accent) {
    document.documentElement.style.setProperty('--gold',       accent);
    document.documentElement.style.setProperty('--gold-light', lightenHex(accent, 20));
    document.documentElement.style.setProperty('--gold-pale',  lightenHex(accent, 70));
  }
}
function hexToRgba(hex, alpha) {
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}
function lightenHex(hex, amount) {
  let r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  r=Math.min(255,r+amount);g=Math.min(255,g+amount);b=Math.min(255,b+amount);
  return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}

// ── Logo / favicon
function applyLogoImg() {
  // Logo image is shared across languages (brand asset)
  const stored = localStorage.getItem('edit_img_logo.image');
  document.querySelectorAll('#logoImg,#footerLogoImg,.logo-img').forEach(img => {
    img.src = stored || ''; img.style.display = stored ? 'block' : 'none';
  });
  document.querySelectorAll('#logoIconDefault,.footer-logo-icon,.logo-icon').forEach(ic => {
    ic.style.display = stored ? 'none' : '';
  });
}
function applyFavicon() {
  const stored = localStorage.getItem('edit_img_site.favicon');
  const fav = document.getElementById('siteFavicon');
  if (stored && fav) fav.href = stored;
}

// ── Hydrate localStorage from server data
// Handles both [] and {} for arrays-that-should-be-objects
function hydrateFromServerData(data) {
  if (!data || data.status === 'empty') return;

  // editableContent: stored as edit_zh_xxx (new) or edit_xxx (legacy → treat as zh)
  if (data.editableContent && !Array.isArray(data.editableContent)) {
    Object.entries(data.editableContent).forEach(([k, v]) => {
      // New format: already namespaced
      if (k.startsWith('zh_') || k.startsWith('en_')) {
        localStorage.setItem('edit_' + k, v);
      } else {
        // Legacy format: treat as zh
        localStorage.setItem('edit_zh_' + k, v);
        // Also keep legacy key for backward compat during transition
        localStorage.setItem('edit_' + k, v);
      }
    });
  }

  // editableImages: may be [] (empty array from old save) or {}
  if (data.editableImages && !Array.isArray(data.editableImages)) {
    Object.entries(data.editableImages).forEach(([k, v]) => {
      if (k.startsWith('zh_') || k.startsWith('en_')) {
        localStorage.setItem('edit_img_' + k, v);
      } else {
        localStorage.setItem('edit_img_zh_' + k, v);
        localStorage.setItem('edit_img_' + k, v);
      }
    });
  }

  // btnActions: may be [] or {}
  if (data.btnActions && !Array.isArray(data.btnActions)) {
    Object.entries(data.btnActions).forEach(([k, v]) => localStorage.setItem('btn_action_' + k, v));
  }

  if (data.productsData) localStorage.setItem('productsData', JSON.stringify(data.productsData));

  if (data.themeColors) {
    if (data.themeColors.primary) localStorage.setItem('theme.primary', data.themeColors.primary);
    if (data.themeColors.accent)  localStorage.setItem('theme.accent',  data.themeColors.accent);
  }

  if (data.siteDefaultLang) localStorage.setItem('site.defaultLang', data.siteDefaultLang);
}

// ── Load editable content for current language into DOM
function loadEditableContent() {
  const lang = window.currentLang || 'zh';

  // Text content: try lang-specific key, then i18n dict (handled by applyTranslations)
  document.querySelectorAll('[data-editable]').forEach(el => {
    const key = el.getAttribute('data-editable');
    const stored = window.getStoredContent ? window.getStoredContent(lang, key) : null;
    if (stored !== null) el.textContent = stored;
  });

  // Images: try lang-specific key, then shared key
  document.querySelectorAll('[data-editable-img]').forEach(el => {
    const key = el.getAttribute('data-editable-img');
    const stored = window.getStoredImage ? window.getStoredImage(lang, key) : localStorage.getItem('edit_img_' + key);
    if (stored) el.src = stored;
  });

  applyLogoImg();
  applyFavicon();
  applyThemeColors();
}

// ── Collect all data for server sync
function collectAllData() {
  const data = {
    editableContent: {}, editableImages: {}, btnActions: {},
    productsData: window.ProductsDB ? ProductsDB.load() : null,
    themeColors: {
      primary: localStorage.getItem('theme.primary'),
      accent:  localStorage.getItem('theme.accent')
    },
    siteDefaultLang: localStorage.getItem('site.defaultLang') || 'auto'
  };
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k.startsWith('edit_img_'))   data.editableImages[k.replace('edit_img_', '')] = localStorage.getItem(k);
    else if (k.startsWith('edit_'))  data.editableContent[k.replace('edit_', '')]    = localStorage.getItem(k);
    else if (k.startsWith('btn_action_')) data.btnActions[k.replace('btn_action_', '')] = localStorage.getItem(k);
  }
  return data;
}

// ── Push to server
window.syncToServer = function(onSuccess, onError) {
  const token = getApiToken();
  if (!token) return;
  fetch('api.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save', token, data: collectAllData() })
  })
  .then(r => r.json())
  .then(resp => {
    if (resp.status === 'ok') { onSuccess && onSuccess(); }
    else if (resp.error === 'invalid_token') {
      sessionStorage.removeItem(API_TOKEN_KEY);
      localStorage.removeItem(ADMIN_SESSION_KEY);
      showSiteToast('⚠ 登录已过期，请重新登录后台');
    } else { onError && onError(resp.error); }
  })
  .catch(() => { onError && onError('network'); });
};

// ── Edit mode
function enableEditMode() {
  document.body.classList.add('admin-mode', 'edit-mode');
  document.querySelectorAll('[data-editable]').forEach(el => {
    el.contentEditable = 'true';
    el.addEventListener('blur', () => {
      const key  = el.getAttribute('data-editable');
      const lang = window.currentLang || 'zh';
      // Save to lang-specific key
      localStorage.setItem(window.editKey(lang, key), el.textContent);
    });
  });
  document.querySelectorAll('[data-editable-img]').forEach(el => {
    el.addEventListener('click', () => showImageEditor(el.getAttribute('data-editable-img'), el));
  });
}

// ── Image editor dialog
function showImageEditor(key, triggerEl) {
  const lang = window.currentLang || 'zh';
  const cur  = (window.getStoredImage ? window.getStoredImage(lang, key) : null) || triggerEl?.src || '';
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99997;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;padding:20px';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:32px;max-width:480px;width:100%;box-shadow:0 24px 80px rgba(0,0,0,0.4)">
      <h3 style="margin-bottom:4px;color:#0a1628;font-family:'Playfair Display',serif;font-size:1.2rem">更换图片</h3>
      <p style="color:#888;font-size:.85rem;margin-bottom:20px">当前语言：${lang === 'zh' ? '中文' : 'English'} | 键值：${key}</p>
      <img id="imgEditorPrev" src="${cur}" style="width:100%;height:140px;object-fit:cover;border-radius:8px;margin-bottom:14px;border:1px solid #eee;background:#f5f5f5">
      <input type="url" id="imgEditorUrl" value="${cur}" placeholder="https://..." style="width:100%;padding:10px;border:2px solid #ddd;border-radius:6px;font-size:.9rem;margin-bottom:10px;outline:none;box-sizing:border-box">
      <div style="display:flex;gap:8px;margin-bottom:10px">
        <button onclick="document.getElementById('imgEditorPrev').src=document.getElementById('imgEditorUrl').value" style="flex:1;padding:9px;background:#f0f2f5;border:1px solid #ddd;border-radius:6px;cursor:pointer;font-size:.85rem">预览URL</button>
        <label style="flex:1;padding:9px;background:#f0f2f5;border:1px solid #ddd;border-radius:6px;cursor:pointer;font-size:.85rem;text-align:center">📤 上传<input type="file" accept="image/*" style="display:none" onchange="(r=>{r.onload=e=>{document.getElementById('imgEditorPrev').src=e.target.result;document.getElementById('imgEditorUrl').value=e.target.result};r.readAsDataURL(this.files[0])})(new FileReader())"></label>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
        <button onclick="this.closest('[style*=fixed]').remove()" style="padding:10px 24px;background:#f0f2f5;border:1px solid #ddd;border-radius:6px;cursor:pointer;font-family:inherit">取消</button>
        <button onclick="applyImageEdit('${key}')" style="padding:10px 24px;background:#c9a84c;color:#0a1628;border:none;border-radius:6px;font-weight:700;cursor:pointer;font-family:inherit">应用</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function applyImageEdit(key) {
  const lang = window.currentLang || 'zh';
  const url  = document.getElementById('imgEditorUrl').value || document.getElementById('imgEditorPrev').src;
  // Special shared assets: logo and favicon apply to both languages
  if (key === 'logo.image' || key === 'site.favicon') {
    localStorage.setItem('edit_img_' + key, url);
  } else {
    localStorage.setItem(window.editImgKey(lang, key), url);
  }
  document.querySelectorAll(`[data-editable-img="${key}"]`).forEach(el => el.src = url);
  if (key === 'logo.image')   applyLogoImg();
  if (key === 'site.favicon') applyFavicon();
  document.querySelector('[style*="position:fixed"]')?.remove();
  showSiteToast('图片已更新');
  window.syncToServer();
}

// ── Floating edit bar
function injectEditBar() {
  const bar = document.createElement('div');
  bar.id = 'editBar';
  bar.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0a1628;color:#fff;padding:12px 24px;border-radius:40px;z-index:9990;display:flex;align-items:center;gap:14px;box-shadow:0 8px 32px rgba(0,0,0,0.4);white-space:nowrap';
  bar.innerHTML = `
    <span style="font-size:.85rem;opacity:.7">✏ 编辑模式</span>
    <button onclick="openSidebarEditor()" style="padding:7px 18px;background:#c9a84c;color:#0a1628;border:none;border-radius:20px;font-weight:700;cursor:pointer;font-size:.85rem;font-family:inherit">侧边栏编辑</button>
    <button onclick="saveFrontChanges()" style="padding:7px 18px;background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.3);border-radius:20px;cursor:pointer;font-size:.85rem;font-family:inherit">💾 保存</button>
    <a href="admin.html" style="padding:7px 18px;background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:20px;font-size:.85rem;text-decoration:none">⚙ 后台</a>
    <button onclick="exitAdminMode()" style="padding:7px 18px;background:rgba(255,80,80,.2);color:#ff9999;border:1px solid rgba(255,80,80,.3);border-radius:20px;cursor:pointer;font-size:.85rem;font-family:inherit">退出</button>`;
  document.body.appendChild(bar);
}

function saveFrontChanges() {
  const lang = window.currentLang || 'zh';
  document.querySelectorAll('[data-editable]').forEach(el => {
    localStorage.setItem(window.editKey(lang, el.getAttribute('data-editable')), el.textContent);
  });
  window.syncToServer(
    () => showSiteToast('✅ 已保存并同步到服务器'),
    () => showSiteToast('✅ 已本地保存（服务器同步失败）')
  );
}

function exitAdminMode() {
  if (!confirm('确定退出编辑模式？')) return;
  const token = getApiToken();
  if (token) {
    fetch('api.php', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action:'logout', token }) }).catch(() => {});
  }
  sessionStorage.removeItem(API_TOKEN_KEY);
  localStorage.removeItem(ADMIN_SESSION_KEY);
  location.reload();
}

// ── Toast
function showSiteToast(msg, duration=2800) {
  let t = document.getElementById('siteToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'siteToast';
    t.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%) translateY(10px);background:#0a1628;color:#fff;padding:11px 24px;border-radius:30px;z-index:99999;opacity:0;transition:.3s;font-size:.9rem;border-left:4px solid #c9a84c;pointer-events:none';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  setTimeout(() => { t.style.opacity='1'; t.style.transform='translateX(-50%) translateY(0)'; }, 10);
  setTimeout(() => { t.style.opacity='0'; }, duration);
}
window.showSiteToast = showSiteToast;

// ── Scroll animations
function initScrollAnim() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.style.opacity='1'; e.target.style.transform='translateY(0)'; }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.feature-card,.product-preview-card,.product-card,.team-card,.cert-item,.mission-card,.product-category-section').forEach(el => {
    el.style.opacity='0'; el.style.transform='translateY(28px)';
    el.style.transition='opacity .55s ease, transform .55s ease';
    obs.observe(el);
  });
}

// ── Re-render on language change (front-end toggle)
document.addEventListener('langChanged', () => {
  loadEditableContent();
  if (typeof applyAllBtnActions === 'function') applyAllBtnActions();
  if (typeof renderAllCategories  === 'function') renderAllCategories();
});

// ── Render page
function renderPage() {
  loadEditableContent();
  if (typeof applyAllBtnActions  === 'function') applyAllBtnActions();
  if (typeof renderAllCategories === 'function') renderAllCategories();
  if (isAdminMode()) {
    injectEditBar();
    enableEditMode();
    setTimeout(loadEditableContent, 30);
  }
  initScrollAnim();
}

// ── INIT: fetch server data, then render
document.addEventListener('DOMContentLoaded', () => {
  fetch('api.php')
    .then(r => { if (!r.ok) throw new Error('no api'); return r.json(); })
    .then(data => { hydrateFromServerData(data); })
    .catch(() => {})
    .finally(() => { renderPage(); });
});
