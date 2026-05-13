// ===== ADMIN PANEL JS v4 =====
// Changes vs v3:
//  - Login calls api.php → gets server-issued token stored in sessionStorage
//  - All saves call syncToServer() to persist to site-data.json on server
//  - changePassword calls api.php change_password endpoint
//  - switchAdminLang fixed: updates button highlight + translates sidebar labels
//  - On init: loads server data first, then hydrates fields
//  - renderBtnEditor uses window.PAGES (set by btn-actions.js)

const ADMIN_SESSION_KEY = 'adminLoggedIn';
const API_TOKEN_KEY     = 'apiToken';   // sessionStorage — clears on tab close
const ADMIN_PWD_KEY     = 'adminPassword'; // kept only for local fallback display

// ── BRUTE FORCE (client-side layer, server also enforces its own) ──
const ATTEMPT_KEY    = 'adminAttempts';
const LOCKOUT_KEY    = 'adminLockoutUntil';
const MAX_ATTEMPTS   = 5;
const LOCKOUT_MINUTES= 15;

function getAttempts()     { return parseInt(localStorage.getItem(ATTEMPT_KEY) || '0'); }
function getLockoutUntil() { return parseInt(localStorage.getItem(LOCKOUT_KEY) || '0'); }

function isLockedOut() {
  const until = getLockoutUntil();
  if (until && Date.now() < until) return true;
  if (until && Date.now() >= until) {
    localStorage.removeItem(LOCKOUT_KEY);
    localStorage.removeItem(ATTEMPT_KEY);
  }
  return false;
}

function recordFailedAttempt() {
  const attempts = getAttempts() + 1;
  localStorage.setItem(ATTEMPT_KEY, attempts);
  if (attempts >= MAX_ATTEMPTS) {
    localStorage.setItem(LOCKOUT_KEY, Date.now() + LOCKOUT_MINUTES * 60000);
    localStorage.removeItem(ATTEMPT_KEY);
    return true;
  }
  return false;
}

function resetFailures() {
  localStorage.removeItem(ATTEMPT_KEY);
  localStorage.removeItem(LOCKOUT_KEY);
}

function updateLockoutTimer() {
  const until = getLockoutUntil();
  const lockoutEl = document.getElementById('lockoutMsg');
  const loginBtn  = document.getElementById('loginBtn');
  if (!until || Date.now() >= until) {
    if (lockoutEl) lockoutEl.style.display = 'none';
    if (loginBtn)  loginBtn.disabled = false;
    return;
  }
  const remaining = Math.ceil((until - Date.now()) / 1000);
  const mins = Math.floor(remaining / 60), secs = remaining % 60;
  if (lockoutEl) {
    lockoutEl.style.display = 'block';
    lockoutEl.textContent = `账户已锁定，请在 ${mins}:${String(secs).padStart(2,'0')} 后重试`;
  }
  if (loginBtn) loginBtn.disabled = true;
}

// ── API token
function getApiToken()  { return sessionStorage.getItem(API_TOKEN_KEY) || ''; }
function setApiToken(t) { sessionStorage.setItem(API_TOKEN_KEY, t); }

// ── ADMIN LANGUAGE ────────────────────────────────────────────────
let adminLang = localStorage.getItem('adminLang') || 'zh';
const adminI18n = {
  zh: {
    save:'💾 保存更改', preview:'👁 预览', logout:'退出登录',
    home:'首页管理', products:'产品管理', about:'关于我们', contact:'联系我们',
    buttons:'按钮管理', settings:'网站设置', theme:'主题颜色', password:'修改密码',
    resetConfirm:'确定重置所有内容为默认值吗？此操作不可撤销！',
    saveOk:'✅ 保存并同步成功！', saveFail:'⚠ 本地已保存，服务器同步失败',
    tokenExpired:'登录已过期，请重新登录'
  },
  en: {
    save:'💾 Save Changes', preview:'👁 Preview', logout:'Sign Out',
    home:'Home Page', products:'Products', about:'About Us', contact:'Contact',
    buttons:'Buttons', settings:'Settings', theme:'Theme', password:'Password',
    resetConfirm:'Reset all content to defaults? This cannot be undone!',
    saveOk:'✅ Saved & synced to server!', saveFail:'⚠ Saved locally. Server sync failed.',
    tokenExpired:'Session expired. Please log in again.'
  }
};
function t(k) { return (adminI18n[adminLang] || adminI18n.zh)[k] || k; }

function switchAdminLang(lang) {
  adminLang = lang;
  localStorage.setItem('adminLang', lang);

  // Update button highlight
  const btnZh = document.getElementById('adminLangZh');
  const btnEn = document.getElementById('adminLangEn');
  if (btnZh && btnEn) {
    const active   = 'background:#0a1628;color:#c9a84c';
    const inactive = 'background:transparent;color:#666';
    btnZh.setAttribute('style', btnZh.getAttribute('style').replace(/background:[^;]+;color:[^;']+/, lang==='zh' ? active : inactive));
    btnEn.setAttribute('style', btnEn.getAttribute('style').replace(/background:[^;]+;color:[^;']+/, lang==='en' ? active : inactive));
  }

  // Translate sidebar nav labels
  const navLabels = {
    home:['首页','Home'], products:['产品介绍','Products'], about:['关于我们','About Us'],
    contact:['联系我们','Contact'], buttons:['按钮管理','Buttons'],
    settings:['网站设置','Settings'], theme:['主题颜色','Theme'], password:['修改密码','Password']
  };
  document.querySelectorAll('.sidebar-link[onclick]').forEach(a => {
    const m = a.getAttribute('onclick')?.match(/switchPage\('(\w+)'\)/);
    if (!m) return;
    const key = m[1];
    if (navLabels[key]) {
      const icon = a.textContent.trim()[0]; // keep emoji
      a.textContent = icon + ' ' + navLabels[key][lang==='en' ? 1 : 0];
    }
  });

  // Translate breadcrumb
  const bc = document.getElementById('adminBreadcrumb');
  if (bc) {
    const bcMap = {
      '首页管理':'Home Page','产品管理':'Products','关于我们':'About Us','联系我们':'Contact',
      '按钮管理':'Buttons','网站设置':'Settings','主题颜色':'Theme','修改密码':'Password'
    };
    if (lang === 'en') {
      Object.entries(bcMap).forEach(([zh, en]) => {
        bc.textContent = bc.textContent.replace(zh, en).replace('管理后台','Admin Panel');
      });
    } else {
      Object.entries(bcMap).forEach(([zh, en]) => {
        bc.textContent = bc.textContent.replace(en, zh).replace('Admin Panel','管理后台');
      });
    }
  }
}

// ── DEFAULTS (pre-fill admin fields) ─────────────────────────────
const DEFAULTS = {
  'hero.tag':{ zh:'全球领先的贸易伙伴',en:'Your Global Trade Partner' },
  'hero.title':{ zh:'连接世界 共创未来',en:'Connecting the World, Building the Future' },
  'hero.desc':{ zh:'专注国际贸易20余年，为全球客户提供优质产品与一站式供应链解决方案',en:'Over 20 years in international trade, delivering premium products and end-to-end supply chain solutions worldwide.' },
  'hero.btn1':{ zh:'探索产品',en:'Explore Products' },
  'hero.btn2':{ zh:'立即联系',en:'Contact Us' },
  'stats.years':{ zh:'20+',en:'20+' },'stats.yearsLabel':{ zh:'年行业经验',en:'Years of Experience' },
  'stats.countries':{ zh:'80+',en:'80+' },'stats.countriesLabel':{ zh:'覆盖国家地区',en:'Countries & Regions' },
  'stats.clients':{ zh:'5000+',en:'5000+' },'stats.clientsLabel':{ zh:'全球合作客户',en:'Global Partners' },
  'stats.products':{ zh:'1200+',en:'1200+' },'stats.productsLabel':{ zh:'产品品类',en:'Product Categories' },
  'features.title':{ zh:'为何选择我们',en:'Our Advantages' },
  'features.sub':{ zh:'多年深耕国际贸易领域，打造值得信赖的全球供应链',en:'Decades of expertise in global trade, building a trusted worldwide supply chain.' },
  'feat1.title':{ zh:'全球网络',en:'Global Network' },'feat1.desc':{ zh:'覆盖80+国家的完善贸易网络，本地化服务团队随时响应您的需求',en:'A comprehensive trade network spanning 80+ countries with local teams ready to serve you.' },
  'feat2.title':{ zh:'品质保障',en:'Quality Assurance' },'feat2.desc':{ zh:'严苛的质量管控体系，通过ISO9001认证，每一件产品都经过严格检测',en:'Rigorous quality controls with ISO 9001 certification. Every product undergoes strict inspection.' },
  'feat3.title':{ zh:'高效交付',en:'Efficient Delivery' },'feat3.desc':{ zh:'完善的物流体系与仓储网络，确保订单准时交付，响应迅速',en:'A robust logistics and warehousing network ensures timely delivery and rapid response.' },
  'feat4.title':{ zh:'专业服务',en:'Professional Service' },'feat4.desc':{ zh:'经验丰富的贸易专家团队，提供从询价到售后的全流程专业支持',en:'Experienced trade experts providing end-to-end support from inquiry to after-sales.' },
  'cta.title':{ zh:'准备好开始合作了吗？',en:'Ready to Partner With Us?' },
  'cta.desc':{ zh:'立即联系我们的专业团队，获取定制化贸易解决方案',en:'Contact our expert team for a customized trade solution.' },
  'cta.btn':{ zh:'免费咨询',en:'Free Consultation' },
  'logo.text':{ zh:'GlobalTrade Co.',en:'GlobalTrade Co.' },
  'footer.tagline':{ zh:'连接全球，共创价值',en:'Connecting the Globe, Creating Value' },
  'footer.copy':{ zh:'© 2024 GlobalTrade Co. All Rights Reserved.',en:'© 2024 GlobalTrade Co. All Rights Reserved.' },
  'footer.email':{ zh:'✉ info@globaltrade.com',en:'✉ info@globaltrade.com' },
  'footer.phone':{ zh:'📞 +86 400-888-8888',en:'📞 +86 400-888-8888' },
  'footer.address':{ zh:'📍 上海市浦东新区贸易大厦18楼',en:'📍 18F Trade Tower, Pudong New Area, Shanghai' },
  'about.storyTitle':{ zh:'从一粒种子到参天大树',en:'From a Seed to a Towering Tree' },
  'about.storyP1':{ zh:'GlobalTrade Co. 成立于2004年，总部位于上海。二十年来，我们始终坚守"诚信、专业、创新"的核心价值观，从一家小型贸易公司成长为覆盖全球80余个国家和地区的综合性贸易集团。',en:'GlobalTrade Co. was founded in 2004 and is headquartered in Shanghai. Over twenty years, we have upheld the core values of integrity, professionalism, and innovation.' },
  'about.storyP2':{ zh:'我们拥有超过500名专业贸易团队成员，在亚洲、欧洲、北美及中东设有区域办公室，为全球5000余家合作伙伴提供稳定、高效的供应链解决方案。',en:'We have more than 500 professional trade team members and regional offices in Asia, Europe, North America, and the Middle East.' },
  'about.storyP3':{ zh:'面向未来，我们将持续深化数字化贸易能力，以技术赋能贸易，为全球客户创造更大价值。',en:'Looking ahead, we will continue to deepen our digital trade capabilities, empowering trade with technology.' },
  'about.visionText':{ zh:'成为最受信赖的全球贸易伙伴，让世界贸易更简单、更高效',en:'To be the most trusted global trade partner, making world trade simpler and more efficient.' },
  'about.missionText':{ zh:'通过专业服务和创新解决方案，连接全球供需，创造共同价值',en:'To connect global supply and demand through professional services and innovative solutions.' },
  'about.valuesText':{ zh:'诚信为本 · 专业精进 · 创新驱动 · 共赢发展',en:'Integrity · Professionalism · Innovation · Mutual Success' },
  'team1.name':{ zh:'张明远',en:'Michael Zhang' },'team1.role':{ zh:'创始人 & CEO',en:'Founder & CEO' },'team1.bio':{ zh:'20年国际贸易经验，前500强企业高管，主导公司全球战略布局',en:'20 years of international trade experience, former Fortune 500 executive leading global strategy.' },
  'team2.name':{ zh:'李雪婷',en:'Lisa Li' },'team2.role':{ zh:'首席运营官 COO',en:'Chief Operating Officer' },'team2.bio':{ zh:'供应链管理专家，主导公司运营体系优化，推动数字化转型',en:'Supply chain management expert leading operational optimization and digital transformation.' },
  'team3.name':{ zh:'王志远',en:'Victor Wang' },'team3.role':{ zh:'技术总监 CTO',en:'Chief Technology Officer' },'team3.bio':{ zh:'资深技术专家，带领技术团队打造智慧贸易平台，赋能业务增长',en:'Senior technology expert leading development of intelligent trade platforms to drive growth.' },
  'cert1':{ zh:'ISO 9001:2015 质量管理体系认证',en:'ISO 9001:2015 Quality Management System' },
  'cert2':{ zh:'ISO 14001 环境管理体系认证',en:'ISO 14001 Environmental Management System' },
  'cert3':{ zh:'海关AEO高级认证企业',en:'Customs AEO Advanced Certified Enterprise' },
  'cert4':{ zh:'中国对外贸易质量奖',en:'China Foreign Trade Quality Award' },
  'contact.infoTitle':{ zh:'与我们取得联系',en:'Get In Touch' },
  'contact.infoDesc':{ zh:'无论您是寻找优质产品、了解合作方式，还是需要定制化解决方案，我们的专业团队随时准备为您服务。',en:'Whether you are looking for quality products, partnership opportunities, or customized solutions, our professional team is always ready to serve you.' },
  'contact.addressVal':{ zh:'上海市浦东新区张江高科技园区贸易大厦18楼',en:'18F Trade Tower, Zhangjiang Hi-Tech Park, Pudong, Shanghai' },
  'contact.phoneVal':{ zh:'+86 400-888-8888',en:'+86 400-888-8888' },
  'contact.emailVal':{ zh:'info@globaltrade.com',en:'info@globaltrade.com' },
  'contact.hoursVal':{ zh:'周一至周五 9:00 - 18:00 (UTC+8)',en:'Mon–Fri 9:00 AM – 6:00 PM (UTC+8)' },
  'social.wechat':{ zh:'WeChat',en:'WeChat' },'social.linkedin':{ zh:'LinkedIn',en:'LinkedIn' },'social.whatsapp':{ zh:'WhatsApp',en:'WhatsApp' },
  'fp1.cat':{ zh:'电子产品',en:'Electronics' },'fp1.name':{ zh:'智能控制模块',en:'Smart Control Module' },'fp1.desc':{ zh:'高性能工业级智能控制模块，适用于各类自动化场景',en:'High-performance industrial smart control module for various automation applications.' },
  'fp2.cat':{ zh:'机械配件',en:'Mechanical Parts' },'fp2.name':{ zh:'精密轴承组件',en:'Precision Bearing Assembly' },'fp2.desc':{ zh:'采用优质钢材，精密加工，耐磨耐用，适用于高负载环境',en:'Premium steel, precision machined, durable and wear-resistant for high-load environments.' },
  'fp3.cat':{ zh:'包装材料',en:'Packaging' },'fp3.name':{ zh:'环保包装解决方案',en:'Eco Packaging Solutions' },'fp3.desc':{ zh:'可降解材料，符合国际环保标准，助力绿色贸易',en:'Biodegradable materials meeting international environmental standards for green trade.' },
};

function getDefaultVal(key) {
  if (!DEFAULTS[key]) return '';
  return DEFAULTS[key][adminLang] || DEFAULTS[key]['zh'] || '';
}
function getFieldVal(key) { return localStorage.getItem('edit_' + key) || getDefaultVal(key); }
function getImgVal(key)   { return localStorage.getItem('edit_img_' + key) || ''; }

// ── Init
let currentPage = 'home';
let adminProductsData = null;

function initAdmin() {
  // Load server data first, then populate fields
  fetch('api.php')
    .then(r => r.json())
    .then(data => {
      if (window.hydrateFromServerData) hydrateFromServerData(data);
    })
    .catch(() => {})
    .finally(() => {
      adminProductsData = ProductsDB.load();
      loadAllFields();
      renderAdminCategories();
      applyThemePreview();
      switchAdminLang(adminLang); // set correct button highlight + translations
    });
}

// ── Field loading
function loadAllFields() {
  document.querySelectorAll('[data-key]').forEach(el => {
    el.value = getFieldVal(el.getAttribute('data-key'));
  });
  const imgDefaults = {
    'hero.image':    'https://images.unsplash.com/photo-1529400971008-f566de0e6dfc?w=400&q=80',
    'cta.image':     'https://images.unsplash.com/photo-1568992688065-536aad8a12f6?w=400&q=80',
    'about.story':   'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=300&q=80',
    'products.hero': 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=400&q=80',
    'about.hero':    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80',
    'contact.hero':  'https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=400&q=80',
    'logo.image':    '', 'site.favicon': '',
  };
  Object.entries(imgDefaults).forEach(([key, fallback]) => {
    const stored = getImgVal(key);
    const prev = document.getElementById('prev-' + key);
    if (prev) { prev.src = stored || fallback; if (stored) prev.style.display='block'; }
    const inp = document.getElementById('f-' + key);
    if (inp && stored) inp.value = stored;
  });
  const pc = document.getElementById('themeColorPrimary');
  const ac = document.getElementById('themeColorAccent');
  const ph = document.getElementById('themeColorPrimaryHex');
  const ah = document.getElementById('themeColorAccentHex');
  if (pc) { pc.value = localStorage.getItem('theme.primary') || '#0a1628'; if(ph) ph.value=pc.value; }
  if (ac) { ac.value = localStorage.getItem('theme.accent')  || '#c9a84c'; if(ah) ah.value=ac.value; }
}

function handleUpload(input, key) {
  if (!input.files?.[0]) return;
  const r = new FileReader();
  r.onload = e => {
    const d = e.target.result;
    const f = document.getElementById('f-'+key); if(f) f.value=d;
    const p = document.getElementById('prev-'+key); if(p){p.src=d;p.style.display='block';}
    localStorage.setItem('edit_img_'+key, d);
  };
  r.readAsDataURL(input.files[0]);
}

function applyImgUrl(key) {
  const f = document.getElementById('f-'+key); if(!f||!f.value) return;
  const p = document.getElementById('prev-'+key); if(p){p.src=f.value;p.style.display='block';}
  localStorage.setItem('edit_img_'+key, f.value);
}

// ── Sync all data to server
function syncAllToServer(onSuccess, onFail) {
  const token = getApiToken();
  if (!token) { onFail && onFail('no_token'); return; }

  // Collect current localStorage data
  const data = {
    editableContent:{}, editableImages:{}, btnActions:{},
    productsData: adminProductsData || ProductsDB.load(),
    themeColors:{ primary: localStorage.getItem('theme.primary'), accent: localStorage.getItem('theme.accent') }
  };
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k.startsWith('edit_img_'))  data.editableImages[k.replace('edit_img_','')]  = localStorage.getItem(k);
    else if(k.startsWith('edit_')) data.editableContent[k.replace('edit_','')]     = localStorage.getItem(k);
    else if(k.startsWith('btn_action_')) data.btnActions[k.replace('btn_action_','')]= localStorage.getItem(k);
  }

  fetch('api.php', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ action:'save', token, data })
  })
  .then(r => r.json())
  .then(resp => {
    if (resp.status === 'ok') { onSuccess && onSuccess(); }
    else if (resp.error === 'invalid_token') {
      sessionStorage.removeItem(API_TOKEN_KEY);
      localStorage.removeItem(ADMIN_SESSION_KEY);
      showAdminToast(t('tokenExpired'), 'error');
      setTimeout(() => location.reload(), 2000);
    } else { onFail && onFail(resp.error); }
  })
  .catch(() => { onFail && onFail('network'); });
}

// ── Save all admin fields then sync
function saveAll() {
  document.querySelectorAll('[data-key]').forEach(el => {
    const k = el.getAttribute('data-key');
    if (el.value !== '') localStorage.setItem('edit_'+k, el.value);
  });
  document.querySelectorAll('[data-img-key]').forEach(el => {
    if (el.value) localStorage.setItem('edit_img_'+el.getAttribute('data-img-key'), el.value);
  });
  syncAllToServer(
    () => showAdminToast(t('saveOk'), 'success'),
    () => showAdminToast(t('saveFail'), 'error')
  );
}

// ── Theme
function applyThemePreview() {
  const p = document.getElementById('themeColorPrimary')?.value;
  const a = document.getElementById('themeColorAccent')?.value;
  const prev = document.getElementById('themePreview');
  if (prev && p && a) {
    prev.style.background = `linear-gradient(135deg,${p},${a})`;
    prev.textContent = `主色 ${p}  ·  强调色 ${a}`;
    prev.style.color = '#fff';
  }
}

function saveThemeColors() {
  const p = document.getElementById('themeColorPrimary')?.value;
  const a = document.getElementById('themeColorAccent')?.value;
  if (p) localStorage.setItem('theme.primary', p);
  if (a) localStorage.setItem('theme.accent',  a);
  syncAllToServer(
    () => showAdminToast('✅ 主题颜色已保存，刷新前台页面生效', 'success'),
    () => showAdminToast('颜色已保存到本地（服务器同步失败）', 'error')
  );
}

function resetThemeColors() {
  localStorage.removeItem('theme.primary'); localStorage.removeItem('theme.accent');
  const pc=document.getElementById('themeColorPrimary'); if(pc) pc.value='#0a1628';
  const ac=document.getElementById('themeColorAccent');  if(ac) ac.value='#c9a84c';
  const ph=document.getElementById('themeColorPrimaryHex'); if(ph) ph.value='#0a1628';
  const ah=document.getElementById('themeColorAccentHex');  if(ah) ah.value='#c9a84c';
  applyThemePreview();
  showAdminToast('主题颜色已重置为默认值','success');
}

// ── Page switching
function switchPage(page) {
  currentPage = page;
  document.querySelectorAll('.admin-content').forEach(el => el.style.display='none');
  document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active'));
  const pageEl = document.getElementById('page-'+page);
  if (pageEl) pageEl.style.display='block';
  const links = document.querySelectorAll('.sidebar-link');
  const idx = {home:0,products:1,about:2,contact:3,buttons:4,settings:5,theme:6,password:7};
  if (links[idx[page]] !== undefined) links[idx[page]].classList.add('active');
  const bc = {home:'首页管理',products:'产品管理',about:'关于我们',contact:'联系我们',buttons:'按钮管理',settings:'网站设置',theme:'主题颜色',password:'修改密码'};
  document.getElementById('adminBreadcrumb').textContent = '管理后台 / '+(bc[page]||page);
  if (page==='products') renderAdminCategories();
  if (page==='buttons')  renderBtnEditor();
}

function previewPage() {
  const map={home:'index.html',products:'products.html',about:'about.html',contact:'contact.html'};
  window.open('../'+(map[currentPage]||'index.html'),'_blank');
}

// ── Products admin
function renderAdminCategories() {
  adminProductsData = ProductsDB.load();
  const list = document.getElementById('adminCatList'); if(!list) return;
  list.innerHTML = '';
  adminProductsData.categories.forEach(cat => {
    const canDel = adminProductsData.categories.length > 1;
    const block = document.createElement('div'); block.className='admin-cat-block';
    block.innerHTML=`
      <div class="admin-cat-header">
        <h4>📁 ${cat.name}${cat.nameEn?' / '+cat.nameEn:''} <small style="color:#aaa;font-weight:normal">(${cat.products.length}个产品)</small></h4>
        <div class="admin-cat-header-actions">
          <button class="btn-rename-cat" onclick="adminRenameCategory('${cat.id}')">✏ 重命名</button>
          ${canDel?`<button class="btn-del-cat" onclick="adminDeleteCategory('${cat.id}')">🗑 删除</button>`:''}
        </div>
      </div>
      <div class="admin-cat-body">
        <div class="admin-product-list">
          ${cat.products.map(prod=>`
            <div class="admin-product-item">
              <img class="admin-product-thumb" src="${prod.image}" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&q=60'">
              <div class="admin-product-info">
                <strong>${prod.name}</strong>
                ${prod.nameEn?`<span>${prod.nameEn}</span>`:''}
                <span>${(prod.desc||'').slice(0,50)}${prod.desc&&prod.desc.length>50?'...':''}</span>
              </div>
              <div class="admin-product-item-actions">
                <button class="btn-edit-p" onclick="adminEditProduct('${cat.id}','${prod.id}')">✏ 编辑</button>
                ${cat.products.length>1?`<button class="btn-del-p" onclick="adminDeleteProduct('${cat.id}','${prod.id}')">🗑</button>`:''}
              </div>
            </div>`).join('')}
        </div>
        <div style="margin-top:12px">
          <button class="btn btn-primary" style="font-size:.85rem;padding:8px 20px" onclick="adminAddProduct('${cat.id}')">＋ 添加产品</button>
        </div>
      </div>`;
    list.appendChild(block);
  });
}

function adminAddCategory(){
  const name=prompt('新分类名称（中文）：'); if(!name?.trim()) return;
  const nameEn=prompt('英文名称（可选）：')||name;
  adminProductsData.categories.push({id:'cat_'+Date.now(),name:name.trim(),nameEn:nameEn.trim(),products:[{id:'p_'+Date.now(),name:'新产品',nameEn:'New Product',desc:'产品描述',descEn:'Product description',image:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80'}]});
  ProductsDB.save(adminProductsData); renderAdminCategories();
  syncAllToServer(()=>showAdminToast('✅ 分类已添加并同步','success'),()=>showAdminToast('分类已添加（同步失败）','error'));
}
function adminRenameCategory(catId){
  const cat=adminProductsData.categories.find(c=>c.id===catId); if(!cat) return;
  const name=prompt('中文名称：',cat.name); if(!name?.trim()) return;
  const nameEn=prompt('英文名称：',cat.nameEn||'');
  cat.name=name.trim(); cat.nameEn=(nameEn||name).trim();
  ProductsDB.save(adminProductsData); renderAdminCategories();
  syncAllToServer(()=>showAdminToast('✅ 已保存','success'),()=>{});
}
function adminDeleteCategory(catId){
  if(adminProductsData.categories.length<=1){alert('至少保留一个分类！');return;}
  if(!confirm('确定删除该分类及其所有产品吗？'))return;
  adminProductsData.categories=adminProductsData.categories.filter(c=>c.id!==catId);
  ProductsDB.save(adminProductsData); renderAdminCategories();
  syncAllToServer(()=>showAdminToast('分类已删除','success'),()=>{});
}
function adminAddProduct(catId){adminShowProductModal(catId,null);}
function adminEditProduct(catId,prodId){adminShowProductModal(catId,prodId);}
function adminDeleteProduct(catId,prodId){
  const cat=adminProductsData.categories.find(c=>c.id===catId);
  if(!cat||cat.products.length<=1){alert('每个分类至少保留一个产品！');return;}
  if(!confirm('确定删除该产品吗？'))return;
  cat.products=cat.products.filter(p=>p.id!==prodId);
  ProductsDB.save(adminProductsData); renderAdminCategories();
  syncAllToServer(()=>showAdminToast('产品已删除','success'),()=>{});
}

function adminShowProductModal(catId,prodId){
  const cat=adminProductsData.categories.find(c=>c.id===catId); if(!cat) return;
  const prod=prodId?cat.products.find(p=>p.id===prodId):null;
  const overlay=document.createElement('div'); overlay.className='admin-modal-overlay';
  overlay.innerHTML=`<div class="admin-modal">
    <h3>${prod?'编辑产品':'添加新产品'}</h3>
    <div class="admin-grid-2">
      <div class="admin-field"><label>产品名称（中文）*</label><input type="text" id="apm-name" value="${prod?prod.name:''}"></div>
      <div class="admin-field"><label>Product Name (EN)</label><input type="text" id="apm-nameEn" value="${prod?prod.nameEn||'':''}"></div>
      <div class="admin-field" style="grid-column:1/-1"><label>介绍（中文）</label><textarea id="apm-desc" rows="3">${prod?prod.desc:''}</textarea></div>
      <div class="admin-field" style="grid-column:1/-1"><label>Description (EN)</label><textarea id="apm-descEn" rows="3">${prod?prod.descEn||'':''}</textarea></div>
    </div>
    <div class="admin-field"><label>产品图片</label>
      <div class="img-editor">
        <img class="img-preview" id="apm-prev" src="${prod?prod.image:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=60'}">
        <div class="img-controls">
          <input type="url" id="apm-img" placeholder="图片URL" value="${prod?prod.image:''}">
          <div class="or-divider">或</div>
          <label class="btn btn-secondary upload-btn" style="font-size:.82rem;padding:8px 16px">上传图片<input type="file" accept="image/*" onchange="(r=>{r.onload=e=>{document.getElementById('apm-prev').src=e.target.result;document.getElementById('apm-img').value=e.target.result};r.readAsDataURL(this.files[0])})(new FileReader())"></label>
          <button class="btn btn-sm" onclick="document.getElementById('apm-prev').src=document.getElementById('apm-img').value">应用URL</button>
        </div>
      </div>
    </div>
    <div class="admin-modal-actions">
      <button class="btn-cancel" onclick="document.querySelector('.admin-modal-overlay').remove()">取消</button>
      <button class="btn-confirm" onclick="adminSaveProduct('${catId}','${prodId||''}')">保存</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
}

function adminSaveProduct(catId,prodId){
  const cat=adminProductsData.categories.find(c=>c.id===catId); if(!cat) return;
  const name=document.getElementById('apm-name').value.trim(); if(!name){alert('请输入产品名称');return;}
  const obj={name,nameEn:document.getElementById('apm-nameEn').value.trim(),desc:document.getElementById('apm-desc').value.trim(),descEn:document.getElementById('apm-descEn').value.trim(),image:document.getElementById('apm-img').value.trim()||document.getElementById('apm-prev').src};
  if(prodId){const p=cat.products.find(p=>p.id===prodId);if(p)Object.assign(p,obj);}
  else cat.products.push({id:'p_'+Date.now(),...obj});
  ProductsDB.save(adminProductsData);
  document.querySelector('.admin-modal-overlay')?.remove();
  renderAdminCategories();
  syncAllToServer(()=>showAdminToast('✅ 产品已保存并同步','success'),()=>showAdminToast('产品已保存（同步失败）','error'));
}

// ── Button editor
function renderBtnEditor() {
  const list = document.getElementById('btnEditorList');
  if (!list || typeof BTN_REGISTRY === 'undefined') return;

  // window.PAGES is set by btn-actions.js — guaranteed since it's loaded before admin.js
  const pages = window.PAGES || [];

  list.innerHTML = BTN_REGISTRY.map(btn => {
    const action = getBtnAction(btn.key);
    const pageOptions = pages.map(p =>
      `<option value="${p.value}" ${action.target===p.value?'selected':''}>${p.label}</option>`
    ).join('');

    return `
    <div class="btn-editor-row" id="btnrow-${btn.key}" style="border:1.5px solid #e8e8e8;border-radius:10px;padding:20px;margin-bottom:16px;background:#fafafa">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap">
        <div style="flex:1;min-width:200px">
          <div style="font-weight:700;color:#0a1628;margin-bottom:4px;font-size:.95rem">🔘 ${btn.label}</div>
          <div style="font-size:.78rem;color:#aaa;font-family:monospace">data-btn-key="${btn.key}"</div>
        </div>
        <div style="flex:2;min-width:280px">
          <div style="display:flex;gap:0;border:1.5px solid #ddd;border-radius:8px;overflow:hidden;margin-bottom:12px">
            ${[{v:'page',icon:'📄',label:'跳转页面'},{v:'email',icon:'✉',label:'发送邮件'},{v:'external',icon:'🔗',label:'外部链接'},{v:'none',icon:'🚫',label:'无动作'}].map(opt=>`
              <label style="flex:1;display:flex;align-items:center;justify-content:center;gap:4px;padding:8px 4px;cursor:pointer;font-size:.8rem;font-weight:600;background:${action.type===opt.v?'#0a1628':'#fff'};color:${action.type===opt.v?'#c9a84c':'#666'};border-right:1px solid #ddd;transition:.2s">
                <input type="radio" name="btntype-${btn.key}" value="${opt.v}" ${action.type===opt.v?'checked':''} onchange="onBtnTypeChange('${btn.key}',this.value)" style="display:none">
                ${opt.icon} ${opt.label}
              </label>`).join('')}
          </div>
          <div id="btnpage-${btn.key}" style="display:${action.type==='page'?'block':'none'}">
            <label style="font-size:.8rem;font-weight:700;color:#555;display:block;margin-bottom:5px">选择目标页面</label>
            <select id="btntarget-page-${btn.key}" style="width:100%;padding:10px;border:1.5px solid #ddd;border-radius:6px;font-size:.9rem;font-family:inherit;background:#fff">
              ${pageOptions}
            </select>
          </div>
          <div id="btnemail-${btn.key}" style="display:${action.type==='email'?'block':'none'}">
            <label style="font-size:.8rem;font-weight:700;color:#555;display:block;margin-bottom:5px">收件邮箱地址</label>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="color:#888;font-size:.9rem;white-space:nowrap">mailto:</span>
              <input type="email" id="btntarget-email-${btn.key}" placeholder="info@yourcompany.com" value="${action.type==='email'?action.target:''}" style="flex:1;padding:10px;border:1.5px solid #ddd;border-radius:6px;font-size:.9rem;font-family:inherit;outline:none">
            </div>
            <div style="font-size:.78rem;color:#aaa;margin-top:5px">点击按钮后将自动打开邮件客户端</div>
          </div>
          <div id="btnext-${btn.key}" style="display:${action.type==='external'?'block':'none'}">
            <label style="font-size:.8rem;font-weight:700;color:#555;display:block;margin-bottom:5px">外部链接URL</label>
            <input type="url" id="btntarget-ext-${btn.key}" placeholder="https://..." value="${action.type==='external'?action.target:''}" style="width:100%;padding:10px;border:1.5px solid #ddd;border-radius:6px;font-size:.9rem;font-family:inherit;outline:none;box-sizing:border-box">
            <div style="font-size:.78rem;color:#aaa;margin-top:5px">在新标签页打开</div>
          </div>
          <div id="btnnone-${btn.key}" style="display:${action.type==='none'?'block':'none'};color:#aaa;font-size:.85rem;padding:8px 0">装饰性按钮，点击无响应</div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function onBtnTypeChange(key, type) {
  ['btnpage','btnemail','btnext','btnnone'].forEach(p => {
    const el=document.getElementById(p+'-'+key); if(el) el.style.display='none';
  });
  const map={page:'btnpage',email:'btnemail',external:'btnext',none:'btnnone'};
  const show=document.getElementById(map[type]+'-'+key); if(show) show.style.display='block';
  const row=document.getElementById('btnrow-'+key); if(!row) return;
  row.querySelectorAll('label').forEach(lbl=>{
    const r=lbl.querySelector('input[type=radio]'); if(!r) return;
    lbl.style.background=r.checked?'#0a1628':'#fff';
    lbl.style.color=r.checked?'#c9a84c':'#666';
  });
}

function getSelectedBtnAction(key) {
  let type='page';
  document.querySelectorAll(`input[name="btntype-${key}"]`).forEach(r=>{if(r.checked)type=r.value;});
  let target='';
  if(type==='page')     { const s=document.getElementById('btntarget-page-'+key);  target=s?s.value:''; }
  if(type==='email')    { const s=document.getElementById('btntarget-email-'+key); target=s?s.value.trim():''; }
  if(type==='external') { const s=document.getElementById('btntarget-ext-'+key);   target=s?s.value.trim():''; }
  return {type,target};
}

function saveBtnActions() {
  if(typeof BTN_REGISTRY==='undefined') return;
  BTN_REGISTRY.forEach(btn=>{
    const a=getSelectedBtnAction(btn.key);
    setBtnAction(btn.key,a.type,a.target);
  });
  syncAllToServer(
    ()=>showAdminToast('✅ 按钮设置已保存并同步！','success'),
    ()=>showAdminToast('按钮设置已保存（同步失败）','error')
  );
}

// ── Password change (via API)
function changePassword() {
  const cur=document.getElementById('curPwd').value;
  const np =document.getElementById('newPwd').value;
  const cp =document.getElementById('confirmPwd').value;
  const msg=document.getElementById('pwdMsg');
  if (np.length < 6) {
    msg.className='admin-msg error'; msg.textContent='新密码至少6位'; msg.style.display='block'; return;
  }
  if (np !== cp) {
    msg.className='admin-msg error'; msg.textContent='两次密码不一致'; msg.style.display='block'; return;
  }
  const token = getApiToken();
  if (!token) {
    msg.className='admin-msg error'; msg.textContent='请先重新登录'; msg.style.display='block'; return;
  }
  fetch('api.php', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ action:'change_password', token, current:cur, new:np })
  })
  .then(r=>r.json())
  .then(resp=>{
    if (resp.status==='ok') {
      msg.className='admin-msg success';
      msg.textContent='密码修改成功！请重新登录';
      msg.style.display='block';
      ['curPwd','newPwd','confirmPwd'].forEach(id=>document.getElementById(id).value='');
      // Force re-login: token was invalidated server-side
      setTimeout(()=>{
        sessionStorage.removeItem(API_TOKEN_KEY);
        localStorage.removeItem(ADMIN_SESSION_KEY);
        location.reload();
      }, 2000);
    } else if (resp.error==='wrong_current_password') {
      msg.className='admin-msg error'; msg.textContent='当前密码错误'; msg.style.display='block';
    } else if (resp.error==='invalid_token') {
      msg.className='admin-msg error'; msg.textContent='登录已过期，请重新登录'; msg.style.display='block';
    } else {
      msg.className='admin-msg error'; msg.textContent='修改失败：'+resp.error; msg.style.display='block';
    }
  })
  .catch(()=>{
    // api.php not available — fall back to localStorage only
    msg.className='admin-msg error';
    msg.textContent='无法连接服务器（api.php），请确认已上传PHP文件';
    msg.style.display='block';
  });
}

// ── Data management
function exportData(){
  const data={editableContent:{},editableImages:{},btnActions:{},productsData:ProductsDB.load(),themeColors:{primary:localStorage.getItem('theme.primary'),accent:localStorage.getItem('theme.accent')},exportTime:new Date().toISOString()};
  for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('edit_img_'))data.editableImages[k.replace('edit_img_','')]=localStorage.getItem(k);else if(k.startsWith('edit_'))data.editableContent[k.replace('edit_','')]=localStorage.getItem(k);else if(k.startsWith('btn_action_'))data.btnActions[k.replace('btn_action_','')]=localStorage.getItem(k);}
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='globaltrade-backup-'+Date.now()+'.json';a.click();
  showAdminToast('✅ 数据已导出','success');
}

function importData(input){
  if(!input.files[0])return;
  const r=new FileReader();
  r.onload=e=>{
    try{
      const data=JSON.parse(e.target.result);
      if(data.editableContent)Object.entries(data.editableContent).forEach(([k,v])=>localStorage.setItem('edit_'+k,v));
      if(data.editableImages)Object.entries(data.editableImages).forEach(([k,v])=>localStorage.setItem('edit_img_'+k,v));
      if(data.btnActions)Object.entries(data.btnActions).forEach(([k,v])=>localStorage.setItem('btn_action_'+k,v));
      if(data.productsData)ProductsDB.save(data.productsData);
      if(data.themeColors){if(data.themeColors.primary)localStorage.setItem('theme.primary',data.themeColors.primary);if(data.themeColors.accent)localStorage.setItem('theme.accent',data.themeColors.accent);}
      loadAllFields(); renderAdminCategories();
      syncAllToServer(()=>showAdminToast('✅ 导入并同步成功！','success'),()=>showAdminToast('已导入到本地（同步失败）','error'));
    }catch(err){showAdminToast('❌ 数据格式错误','error');}
  };
  r.readAsText(input.files[0]);
}

function resetData(){
  if(!confirm(t('resetConfirm')))return;
  const keep=[ATTEMPT_KEY,LOCKOUT_KEY,API_TOKEN_KEY,'adminLang','lang'];
  const keys=[];for(let i=0;i<localStorage.length;i++)keys.push(localStorage.key(i));
  keys.filter(k=>!keep.includes(k)&&(k.startsWith('edit_')||k==='productsData'||k.startsWith('theme.')||k.startsWith('btn_action_')||k===ADMIN_SESSION_KEY)).forEach(k=>localStorage.removeItem(k));
  adminProductsData=ProductsDB.reset();
  loadAllFields(); renderAdminCategories();
  syncAllToServer(()=>showAdminToast('✅ 已重置并同步','success'),()=>showAdminToast('已重置本地（同步失败）','error'));
}

// ── Toast
function showAdminToast(msg, type='success'){
  const toast=document.getElementById('adminToast'); if(!toast) return;
  toast.textContent=msg; toast.className='admin-toast show '+type;
  setTimeout(()=>toast.className='admin-toast',3000);
}

// ── LOGIN (API-based)
function doLogin() {
  if (isLockedOut()) { updateLockoutTimer(); return; }
  const password = document.getElementById('adminPassword').value;

  // Show loading state
  const btn = document.getElementById('loginBtn');
  if (btn) { btn.disabled=true; btn.textContent='验证中...'; }

  fetch('api.php', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ action:'login', password })
  })
  .then(r => r.json())
  .then(resp => {
    if (resp.status === 'ok' && resp.token) {
      // Success
      resetFailures();
      setApiToken(resp.token);
      localStorage.setItem(ADMIN_SESSION_KEY, '1');
      document.getElementById('loginOverlay').style.display='none';
      document.getElementById('adminPanel').style.display='flex';
      initAdmin();
    } else if (resp.error === 'wrong_password') {
      handleLoginFail(`密码错误，还可尝试 ${resp.remaining} 次`);
    } else if (resp.error === 'locked') {
      const mins = Math.floor(resp.retry_after / 60);
      handleLoginFail(`服务器：账户已锁定，请 ${mins} 分钟后重试`);
      if (btn) btn.disabled = true;
    } else {
      handleLoginFail('登录失败：' + (resp.error || '未知错误'));
    }
  })
  .catch(() => {
    // api.php not reachable — fall back to localStorage password for local dev/testing
    const storedPwd = localStorage.getItem(ADMIN_PWD_KEY) || 'admin123';
    if (password === storedPwd) {
      resetFailures();
      localStorage.setItem(ADMIN_SESSION_KEY, '1');
      document.getElementById('loginOverlay').style.display='none';
      document.getElementById('adminPanel').style.display='flex';
      initAdmin();
      showAdminToast('⚠ 离线模式：修改仅保存在本地，请上传api.php', 'error');
    } else {
      const locked = recordFailedAttempt();
      handleLoginFail(locked ? `密码错误次数过多，账户已锁定 ${LOCKOUT_MINUTES} 分钟` : `密码错误，还可尝试 ${MAX_ATTEMPTS-getAttempts()} 次`);
    }
  })
  .finally(() => {
    if (btn && !isLockedOut()) { btn.disabled=false; btn.textContent='登 录'; }
  });
}

function handleLoginFail(msg) {
  const errEl = document.getElementById('loginError');
  if (errEl) { errEl.textContent=msg; errEl.classList.add('show'); }
  document.getElementById('adminPassword').value='';
  document.getElementById('adminPassword').focus();
  if (isLockedOut()) updateLockoutTimer();
}

function doLogout() {
  const token = getApiToken();
  if (token) {
    fetch('api.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'logout',token})}).catch(()=>{});
  }
  sessionStorage.removeItem(API_TOKEN_KEY);
  localStorage.removeItem(ADMIN_SESSION_KEY);
  document.getElementById('adminPanel').style.display='none';
  document.getElementById('loginOverlay').style.display='flex';
  document.getElementById('adminPassword').value='';
}

// ── INIT
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem(ADMIN_SESSION_KEY)==='1' && getApiToken()) {
    // Verify token is still valid
    fetch('api.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'check_token',token:getApiToken()})})
      .then(r=>r.json())
      .then(resp=>{
        if (resp.valid) {
          document.getElementById('loginOverlay').style.display='none';
          document.getElementById('adminPanel').style.display='flex';
          initAdmin();
        } else {
          // Token expired
          sessionStorage.removeItem(API_TOKEN_KEY);
          localStorage.removeItem(ADMIN_SESSION_KEY);
        }
      })
      .catch(()=>{
        // No api.php — allow local session
        if (localStorage.getItem(ADMIN_SESSION_KEY)==='1') {
          document.getElementById('loginOverlay').style.display='none';
          document.getElementById('adminPanel').style.display='flex';
          initAdmin();
        }
      });
  } else if (localStorage.getItem(ADMIN_SESSION_KEY)==='1') {
    // Had session flag but no token (e.g. tab was closed) — clear and show login
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }

  if (isLockedOut()) {
    updateLockoutTimer();
    const timer = setInterval(()=>{updateLockoutTimer();if(!isLockedOut())clearInterval(timer);},1000);
  }
  document.getElementById('adminPassword')?.addEventListener('keydown', e=>{if(e.key==='Enter')doLogin();});

  // Init lang button highlight
  switchAdminLang(adminLang);
});
