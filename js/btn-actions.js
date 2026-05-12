// ===== BUTTON ACTIONS SYSTEM =====
// Manages href/action for all data-btn-key buttons
// Storage: localStorage key "btn_action_{key}" = JSON { type, target }
// type: "page" | "email" | "external" | "none"
// target: "products.html" | "mailto:x@y.com" | "https://..." | ""

// Registry of all configurable buttons
window.BTN_REGISTRY = [
  { key: 'hero.btn1',       label: 'Hero 按钮1（探索产品）',     defaultType: 'page',  defaultTarget: 'products.html' },
  { key: 'hero.btn2',       label: 'Hero 按钮2（立即联系）',     defaultType: 'page',  defaultTarget: 'contact.html'  },
  { key: 'featured.more',   label: '首页「查看全部产品」按钮',     defaultType: 'page',  defaultTarget: 'products.html' },
  { key: 'cta.btn',         label: '首页 CTA 按钮（免费咨询）',  defaultType: 'page',  defaultTarget: 'contact.html'  },
  { key: 'social.wechat',   label: '联系页 WeChat 按钮',         defaultType: 'email', defaultTarget: ''              },
  { key: 'social.linkedin',  label: '联系页 LinkedIn 按钮',      defaultType: 'external', defaultTarget: 'https://linkedin.com' },
  { key: 'social.whatsapp', label: '联系页 WhatsApp 按钮',       defaultType: 'external', defaultTarget: 'https://wa.me/' },
  { key: 'contact.submitBtn', label: '联系页「发送询盘」按钮',    defaultType: 'email', defaultTarget: ''              },
];

const PAGES = [
  { value: 'index.html',    label: '首页 (index.html)'     },
  { value: 'products.html', label: '产品介绍 (products.html)' },
  { value: 'about.html',    label: '关于我们 (about.html)'  },
  { value: 'contact.html',  label: '联系我们 (contact.html)' },
];

function getBtnAction(key) {
  const stored = localStorage.getItem('btn_action_' + key);
  if (stored) {
    try { return JSON.parse(stored); } catch(e) {}
  }
  const reg = BTN_REGISTRY.find(b => b.key === key);
  return reg ? { type: reg.defaultType, target: reg.defaultTarget } : { type: 'none', target: '' };
}

function setBtnAction(key, type, target) {
  localStorage.setItem('btn_action_' + key, JSON.stringify({ type, target }));
}

// Apply all button actions to the DOM
function applyAllBtnActions() {
  document.querySelectorAll('[data-btn-key]').forEach(el => {
    const key = el.getAttribute('data-btn-key');
    applyBtnAction(el, key);
  });
}

function applyBtnAction(el, key) {
  const action = getBtnAction(key);
  const { type, target } = action;

  // Remove old listeners by replacing with clone (for buttons)
  // For <a> tags we just set href
  if (el.tagName === 'A') {
    if (type === 'page')     { el.href = target || '#'; el.removeAttribute('onclick'); }
    else if (type === 'email')    { el.href = target ? 'mailto:' + target : '#'; el.removeAttribute('onclick'); }
    else if (type === 'external') { el.href = target || '#'; el.target = '_blank'; el.rel = 'noopener'; el.removeAttribute('onclick'); }
    else { el.href = '#'; }
  } else {
    // button element — set onclick
    el.onclick = (e) => handleBtnClick(key, e);
  }
}

// Called by button elements (not <a> tags)
function handleBtnClick(key, event) {
  const action = getBtnAction(key);
  const { type, target } = action;
  if (type === 'page')     { window.location.href = target || '#'; }
  else if (type === 'email')    {
    if (target) window.location.href = 'mailto:' + target;
    else {
      // fallback: show default form behavior
      alert(window.currentLang === 'en'
        ? 'Message sent! We will reply within 1 business day.'
        : '询盘已发送！我们将在1个工作日内回复您。');
    }
  }
  else if (type === 'external') { window.open(target, '_blank'); }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', applyAllBtnActions);
