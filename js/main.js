// ===== MAIN JS v2 =====
const ADMIN_SESSION_KEY = 'adminLoggedIn';

// ── Header scroll
const header = document.getElementById('siteHeader');
if (header) window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 30));

// ── Mobile menu
function toggleMobileMenu() {
  const nav = document.getElementById('mobileNav');
  if (nav) nav.classList.toggle('open');
}

// ── Check admin
function isAdminMode() { return localStorage.getItem(ADMIN_SESSION_KEY) === '1'; }

// ── Apply theme colors (CSS variables from stored values)
function applyThemeColors() {
  const primary = localStorage.getItem('theme.primary');
  const accent = localStorage.getItem('theme.accent');
  if (primary) document.documentElement.style.setProperty('--navy', primary);
  if (accent) document.documentElement.style.setProperty('--gold', accent);
  // Derive lighter variants
  if (primary) {
    document.documentElement.style.setProperty('--navy-mid', hexToRgba(primary, 0.85));
    document.documentElement.style.setProperty('--navy-light', hexToRgba(primary, 0.65));
  }
  if (accent) {
    document.documentElement.style.setProperty('--gold-light', lightenHex(accent, 20));
    document.documentElement.style.setProperty('--gold-pale', lightenHex(accent, 70));
  }
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}
function lightenHex(hex, amount) {
  let r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  r = Math.min(255, r + amount); g = Math.min(255, g + amount); b = Math.min(255, b + amount);
  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}

// ── Apply logo image
function applyLogoImg() {
  const stored = localStorage.getItem('edit_img_logo.image');
  const logoImgs = document.querySelectorAll('#logoImg, #footerLogoImg, .logo-img');
  const logoIcons = document.querySelectorAll('#logoIconDefault, .footer-logo-icon, .logo-icon');
  if (stored) {
    logoImgs.forEach(img => { img.src = stored; img.style.display = 'block'; });
    logoIcons.forEach(ic => ic.style.display = 'none');
  } else {
    logoImgs.forEach(img => img.style.display = 'none');
    logoIcons.forEach(ic => ic.style.display = '');
  }
}

// ── Apply favicon
function applyFavicon() {
  const stored = localStorage.getItem('edit_img_site.favicon');
  const favicon = document.getElementById('siteFavicon');
  if (stored && favicon) favicon.href = stored;
}

// ── Load stored editable content
function loadEditableContent() {
  document.querySelectorAll('[data-editable]').forEach(el => {
    const key = el.getAttribute('data-editable');
    const stored = localStorage.getItem('edit_' + key);
    if (stored) el.textContent = stored;
  });
  document.querySelectorAll('[data-editable-img]').forEach(el => {
    const key = el.getAttribute('data-editable-img');
    const stored = localStorage.getItem('edit_img_' + key);
    if (stored) el.src = stored;
  });
  applyLogoImg();
  applyFavicon();
  applyThemeColors();
}

// ── Enable inline edit mode (contentEditable + image click)
function enableEditMode() {
  document.body.classList.add('admin-mode','edit-mode');

  document.querySelectorAll('[data-editable]').forEach(el => {
    el.contentEditable = 'true';
    el.addEventListener('blur', () => {
      localStorage.setItem('edit_' + el.getAttribute('data-editable'), el.textContent);
    });
  });

  document.querySelectorAll('[data-editable-img]').forEach(el => {
    el.addEventListener('click', () => showImageEditor(el.getAttribute('data-editable-img'), el));
  });
}

// ── Image replacement dialog
function showImageEditor(key, triggerEl) {
  const cur = localStorage.getItem('edit_img_' + key) || triggerEl?.src || '';
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99997;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;padding:20px';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:32px;max-width:480px;width:100%;box-shadow:0 24px 80px rgba(0,0,0,0.4)">
      <h3 style="margin-bottom:4px;color:#0a1628;font-family:'Playfair Display',serif;font-size:1.2rem">更换图片</h3>
      <p style="color:#888;font-size:.85rem;margin-bottom:20px">键值：${key}</p>
      <img id="imgEditorPrev" src="${cur}" style="width:100%;height:140px;object-fit:cover;border-radius:8px;margin-bottom:14px;border:1px solid #eee;background:#f5f5f5">
      <input type="url" id="imgEditorUrl" value="${cur}" placeholder="https://..." style="width:100%;padding:10px;border:2px solid #ddd;border-radius:6px;font-size:.9rem;margin-bottom:10px;outline:none;box-sizing:border-box">
      <div style="display:flex;gap:8px;margin-bottom:10px">
        <button onclick="document.getElementById('imgEditorPrev').src=document.getElementById('imgEditorUrl').value" style="flex:1;padding:9px;background:#f0f2f5;border:1px solid #ddd;border-radius:6px;cursor:pointer;font-size:.85rem">预览URL</button>
        <label style="flex:1;padding:9px;background:#f0f2f5;border:1px solid #ddd;border-radius:6px;cursor:pointer;font-size:.85rem;text-align:center">📤 上传本地<input type="file" accept="image/*" style="display:none" onchange="(r=>{r.onload=e=>{document.getElementById('imgEditorPrev').src=e.target.result;document.getElementById('imgEditorUrl').value=e.target.result};r.readAsDataURL(this.files[0])})(new FileReader())"></label>
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
  const url = document.getElementById('imgEditorUrl').value || document.getElementById('imgEditorPrev').src;
  localStorage.setItem('edit_img_' + key, url);
  document.querySelectorAll(`[data-editable-img="${key}"]`).forEach(el => el.src = url);
  if (key === 'logo.image') applyLogoImg();
  if (key === 'site.favicon') applyFavicon();
  document.querySelector('[style*="position:fixed"]')?.remove();
  showSiteToast('图片已更新');
}

// ── Floating edit bar (shown when in admin mode on front pages)
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
  document.querySelectorAll('[data-editable]').forEach(el => {
    localStorage.setItem('edit_' + el.getAttribute('data-editable'), el.textContent);
  });
  showSiteToast('✅ 已保存所有内容');
}

function exitAdminMode() {
  if (!confirm('确定退出编辑模式？')) return;
  localStorage.removeItem(ADMIN_SESSION_KEY);
  location.reload();
}

// ── Toast
function showSiteToast(msg, duration=2500) {
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
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.feature-card,.product-preview-card,.product-card,.team-card,.cert-item,.mission-card,.product-category-section').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(28px)';
    el.style.transition = 'opacity .55s ease, transform .55s ease';
    obs.observe(el);
  });
}

// ── INIT
document.addEventListener('DOMContentLoaded', () => {
  loadEditableContent();
  if (isAdminMode()) {
    injectEditBar();
    enableEditMode();
    setTimeout(loadEditableContent, 30);
  }
  initScrollAnim();
});
