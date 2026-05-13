// ===== SIDEBAR EDITOR — Real-time page editor with live preview =====
// Triggered from main.js edit bar "侧边栏编辑" button
// Shows a slide-in panel with all editable fields for the current page
// Changes are live; Save/Cancel both show confirmation dialogs

window.openSidebarEditor = function() {
  if (document.getElementById('sidebarEditor')) return;

  // Snapshot current state for cancel
  const snapshot = {};
  document.querySelectorAll('[data-editable]').forEach(el => {
    snapshot['text_' + el.getAttribute('data-editable')] = el.textContent;
  });
  document.querySelectorAll('[data-editable-img]').forEach(el => {
    snapshot['img_' + el.getAttribute('data-editable-img')] = el.src;
  });

  // Build field list from page
  const fields = gatherEditableFields();

  // Sidebar HTML
  const sidebar = document.createElement('div');
  sidebar.id = 'sidebarEditor';
  sidebar.innerHTML = `
    <div id="sidebarBackdrop" style="position:fixed;inset:0;z-index:9980;background:rgba(10,22,40,0.45);transition:.3s;opacity:0"></div>
    <div id="sidebarPanel" style="position:fixed;top:0;left:0;bottom:0;z-index:9981;width:360px;max-width:92vw;background:#fff;box-shadow:6px 0 40px rgba(10,22,40,0.25);display:flex;flex-direction:column;transform:translateX(-100%);transition:transform .35s cubic-bezier(.4,0,.2,1)">

      <!-- Panel Header -->
      <div style="background:#0a1628;padding:18px 20px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
        <div>
          <div style="color:#c9a84c;font-size:.75rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:2px">实时编辑器</div>
          <div style="color:#fff;font-weight:700;font-size:1rem">当前页面内容</div>
        </div>
        <div style="display:flex;gap:6px">
          <select id="sidebarLang" onchange="sidebarSwitchLang(this.value)" style="padding:5px 10px;border-radius:6px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.1);color:#fff;font-size:.82rem;cursor:pointer">
            <option value="zh" ${window.currentLang==='zh'?'selected':''}>中文</option>
            <option value="en" ${window.currentLang==='en'?'selected':''}>EN</option>
          </select>
        </div>
      </div>

      <!-- Live indicator -->
      <div style="background:#1a3358;padding:8px 20px;display:flex;align-items:center;gap:8px;flex-shrink:0">
        <span style="width:8px;height:8px;border-radius:50%;background:#4ade80;display:inline-block;animation:sbPulse 2s infinite"></span>
        <span style="color:rgba(255,255,255,.7);font-size:.8rem">修改实时显示在页面中</span>
      </div>

      <!-- Fields scroll area -->
      <div id="sidebarFields" style="flex:1;overflow-y:auto;padding:16px"></div>

      <!-- Action footer -->
      <div style="border-top:1px solid #eee;padding:16px 20px;display:flex;gap:10px;flex-shrink:0;background:#fafafa">
        <button onclick="sidebarCancel()" style="flex:1;padding:11px;background:#f0f2f5;border:1px solid #ddd;border-radius:8px;cursor:pointer;font-family:inherit;font-size:.9rem;font-weight:600;color:#555">✕ 取消</button>
        <button onclick="sidebarSave()" style="flex:2;padding:11px;background:#c9a84c;color:#0a1628;border:none;border-radius:8px;cursor:pointer;font-family:inherit;font-size:.9rem;font-weight:700">💾 保存更改</button>
      </div>
    </div>

    <style>
      @keyframes sbPulse { 0%,100%{opacity:.5} 50%{opacity:1} }
      #sidebarFields .sb-section { margin-bottom:20px }
      #sidebarFields .sb-section-title { font-size:.72rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#c9a84c;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #f0f0f0 }
      #sidebarFields .sb-field { margin-bottom:12px }
      #sidebarFields .sb-label { font-size:.78rem;font-weight:700;color:#555;margin-bottom:5px;display:block }
      #sidebarFields input, #sidebarFields textarea { width:100%;padding:9px 12px;border:1.5px solid #e0e0e0;border-radius:6px;font-family:inherit;font-size:.88rem;color:#333;outline:none;transition:.2s;box-sizing:border-box;background:#fafafa }
      #sidebarFields input:focus, #sidebarFields textarea:focus { border-color:#c9a84c;background:#fff;box-shadow:0 0 0 3px rgba(201,168,76,.12) }
      #sidebarFields textarea { resize:vertical;min-height:70px }
      .sb-img-wrap { position:relative;border-radius:8px;overflow:hidden;border:2px dashed #ddd;background:#f5f5f5;margin-bottom:6px }
      .sb-img-wrap img { width:100%;height:100px;object-fit:cover;display:block }
      .sb-img-wrap .sb-img-overlay { position:absolute;inset:0;background:rgba(0,0,0,0);display:flex;align-items:center;justify-content:center;transition:.2s }
      .sb-img-wrap:hover .sb-img-overlay { background:rgba(0,0,0,.4) }
      .sb-img-wrap .sb-img-overlay span { color:#fff;font-size:.85rem;font-weight:700;opacity:0;transition:.2s;text-align:center;padding:8px }
      .sb-img-wrap:hover .sb-img-overlay span { opacity:1 }
      .sb-img-row { display:flex;gap:6px }
      .sb-img-row input { flex:1;font-size:.8rem }
      .sb-img-btns { display:flex;gap:5px;margin-top:5px }
      .sb-img-btns button,.sb-img-btns label { flex:1;padding:6px;background:#f0f2f5;border:1px solid #ddd;border-radius:5px;cursor:pointer;font-size:.78rem;text-align:center;font-family:inherit }
    </style>`;

  document.body.appendChild(sidebar);
  window._sbSnapshot = snapshot;

  // Render fields
  renderSidebarFields(fields);

  // Animate in
  requestAnimationFrame(() => {
    document.getElementById('sidebarBackdrop').style.opacity = '1';
    document.getElementById('sidebarPanel').style.transform = 'translateX(0)';
  });

  // Close on backdrop
  document.getElementById('sidebarBackdrop').addEventListener('click', () => sidebarCancel());
};

function gatherEditableFields() {
  const sections = [];
  const seen = new Set();

  // Group fields by proximity / section header
  let curSection = null;
  let curItems = [];

  document.querySelectorAll('[data-editable],[data-editable-img]').forEach(el => {
    const textKey = el.getAttribute('data-editable');
    const imgKey = el.getAttribute('data-editable-img');
    const key = textKey || imgKey;
    if (seen.has(key)) return;
    seen.add(key);

    // Find nearest section title
    let sectionName = getSectionName(el);
    if (sectionName !== curSection) {
      if (curItems.length) sections.push({ title: curSection || '内容', items: curItems });
      curSection = sectionName;
      curItems = [];
    }
    curItems.push({ key, type: textKey ? 'text' : 'img', el, label: getLabelFor(key) });
  });
  if (curItems.length) sections.push({ title: curSection || '内容', items: curItems });
  return sections;
}

function getSectionName(el) {
  // Walk up to find section/div with a heading
  let node = el.parentElement;
  for (let i = 0; i < 8; i++) {
    if (!node) break;
    const h = node.querySelector('h1,h2,h3,.section-tag,.cat-title');
    if (h && h !== el) return h.textContent.trim().slice(0,20) || '—';
    const cls = node.className || '';
    if (cls.includes('hero')) return '横幅区域';
    if (cls.includes('stats')) return '统计数字';
    if (cls.includes('feature')) return '特色优势';
    if (cls.includes('footer')) return '页脚';
    if (cls.includes('cta')) return 'CTA 横幅';
    if (cls.includes('about-story')) return '公司故事';
    if (cls.includes('mission')) return '使命价值观';
    if (cls.includes('team')) return '团队介绍';
    if (cls.includes('cert')) return '荣誉资质';
    if (cls.includes('contact')) return '联系信息';
    node = node.parentElement;
  }
  return '其他内容';
}

const labelMap = {
  'logo.text':'Logo文字','footer.tagline':'页脚标语','footer.copy':'版权信息',
  'footer.email':'邮箱','footer.phone':'电话','footer.address':'地址',
  'hero.tag':'标签文字','hero.title':'主标题','hero.desc':'副标题',
  'hero.btn1':'按钮1文字','hero.btn2':'按钮2文字',
  'hero.image':'横幅背景图','cta.image':'CTA背景图','about.story':'故事配图',
  'about.storyTitle':'故事标题','about.storyP1':'段落1','about.storyP2':'段落2','about.storyP3':'段落3',
  'about.visionText':'愿景文字','about.missionText':'使命文字','about.valuesText':'价值观文字',
  'cta.title':'CTA标题','cta.desc':'CTA描述','cta.btn':'CTA按钮',
  'contact.infoTitle':'联系标题','contact.infoDesc':'联系描述',
  'contact.addressVal':'地址详情','contact.phoneVal':'电话详情','contact.emailVal':'邮箱详情','contact.hoursVal':'工作时间',
  'products.heroTitle':'产品页标题','products.heroSub':'产品页副标题',
  'about.heroTitle':'关于我们标题','about.heroSub':'关于我们副标题',
  'contact.heroTitle':'联系我们标题','contact.heroSub':'联系我们副标题',
};

function getLabelFor(key) {
  if (labelMap[key]) return labelMap[key];
  return key.replace(/[._]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
}

function renderSidebarFields(sections) {
  const container = document.getElementById('sidebarFields');
  container.innerHTML = '';
  sections.forEach(sec => {
    const secEl = document.createElement('div');
    secEl.className = 'sb-section';
    secEl.innerHTML = `<div class="sb-section-title">${sec.title}</div>`;
    sec.items.forEach(item => {
      const field = document.createElement('div');
      field.className = 'sb-field';
      if (item.type === 'text') {
        const curVal = item.el.textContent;
        const isLong = curVal.length > 60 || item.el.tagName === 'P';
        field.innerHTML = `<label class="sb-label">${item.label}</label>
          ${isLong
            ? `<textarea data-sbkey="${item.key}" rows="3">${curVal}</textarea>`
            : `<input type="text" data-sbkey="${item.key}" value="${curVal.replace(/"/g,'&quot;')}">`}`;
        field.querySelector('input,textarea')?.addEventListener('input', e => {
          // Live update
          document.querySelectorAll(`[data-editable="${item.key}"]`).forEach(t => t.textContent = e.target.value);
        });
      } else {
        const curSrc = localStorage.getItem('edit_img_' + item.key) || item.el.src || '';
        field.innerHTML = `<label class="sb-label">${item.label}</label>
          <div class="sb-img-wrap">
            <img id="sbprev_${item.key.replace(/\./g,'_')}" src="${curSrc}" onerror="this.style.opacity='.3'">
            <div class="sb-img-overlay"><span>点击预览区域<br>或填写URL / 上传</span></div>
          </div>
          <div class="sb-img-row">
            <input type="url" data-sbkey="${item.key}" data-type="img" placeholder="图片URL" value="${curSrc}">
          </div>
          <div class="sb-img-btns">
            <button onclick="sbApplyUrl('${item.key}')">应用URL</button>
            <label>📤 上传<input type="file" accept="image/*" style="display:none" onchange="sbHandleUpload(this,'${item.key}')"></label>
          </div>`;
      }
      secEl.appendChild(field);
    });
    container.appendChild(secEl);
  });
}

window.sbApplyUrl = function(key) {
  const input = document.querySelector(`[data-sbkey="${key}"]`);
  if (!input) return;
  const url = input.value;
  const prev = document.getElementById('sbprev_' + key.replace(/\./g,'_'));
  if (prev) prev.src = url;
  document.querySelectorAll(`[data-editable-img="${key}"]`).forEach(el => el.src = url);
  const imgStoreKey = (key === 'logo.image' || key === 'site.favicon') ? 'edit_img_' + key : window.editImgKey(window.currentLang || 'zh', key);
  localStorage.setItem(imgStoreKey, url);
  if (key === 'logo.image') applyLogoImg?.();
};

window.sbHandleUpload = function(input, key) {
  if (!input.files[0]) return;
  const r = new FileReader();
  r.onload = e => {
    const data = e.target.result;
    const urlInput = document.querySelector(`[data-sbkey="${key}"]`);
    if (urlInput) urlInput.value = data;
    const prev = document.getElementById('sbprev_' + key.replace(/\./g,'_'));
    if (prev) prev.src = data;
    document.querySelectorAll(`[data-editable-img="${key}"]`).forEach(el => el.src = data);
    if (key === 'logo.image') applyLogoImg?.();
  };
  r.readAsDataURL(input.files[0]);
};

window.sidebarSwitchLang = function(lang) {
  if (window.applyTranslations) applyTranslations(lang);
  document.dispatchEvent(new CustomEvent('langChanged'));
  // Re-gather fields after lang switch
  setTimeout(() => {
    const fields = gatherEditableFields();
    renderSidebarFields(fields);
  }, 100);
};

window.sidebarSave = function() {
  if (!confirm('确定保存所有更改吗？\n\n保存后内容将立即生效。')) return;

  // Save text fields with lang-prefixed keys
  document.querySelectorAll('#sidebarFields [data-sbkey]').forEach(input => {
    const key  = input.getAttribute('data-sbkey');
    const type = input.getAttribute('data-type');
    const val  = input.value !== undefined ? input.value : input.textContent;
    const lang = window.currentLang || 'zh';
    if (type === 'img') {
      const imgStoreKey = (key === 'logo.image' || key === 'site.favicon')
        ? 'edit_img_' + key
        : (window.editImgKey ? window.editImgKey(lang, key) : 'edit_img_' + key);
      localStorage.setItem(imgStoreKey, val);
      document.querySelectorAll(`[data-editable-img="${key}"]`).forEach(el => el.src = val);
    } else {
      const storeKey = window.editKey ? window.editKey(lang, key) : 'edit_' + key;
      localStorage.setItem(storeKey, val);
      document.querySelectorAll(`[data-editable="${key}"]`).forEach(el => el.textContent = val);
    }
  });

  closeSidebar();
  // Sync to server after saving
  if (window.syncToServer) {
    window.syncToServer(
      () => showSiteToast('✅ 页面内容已保存并同步！'),
      () => showSiteToast('✅ 已保存（服务器同步失败）')
    );
  } else {
    showSiteToast('✅ 页面内容已保存！');
  }
};

window.sidebarCancel = function() {
  if (!confirm('确定放弃所有未保存的更改？\n\n页面内容将恢复到编辑前的状态。')) return;

  // Restore snapshot
  const snap = window._sbSnapshot || {};
  Object.entries(snap).forEach(([k, v]) => {
    if (k.startsWith('text_')) {
      const key = k.slice(5);
      document.querySelectorAll(`[data-editable="${key}"]`).forEach(el => el.textContent = v);
    } else if (k.startsWith('img_')) {
      const key = k.slice(4);
      document.querySelectorAll(`[data-editable-img="${key}"]`).forEach(el => el.src = v);
    }
  });

  closeSidebar();
};

function closeSidebar() {
  const panel = document.getElementById('sidebarPanel');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (panel) panel.style.transform = 'translateX(-100%)';
  if (backdrop) backdrop.style.opacity = '0';
  setTimeout(() => { document.getElementById('sidebarEditor')?.remove(); }, 380);
}
