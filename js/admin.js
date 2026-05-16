// ===== admin.js v5 =====
// Changes:
//  - Edit language selector in sidebar (separate from UI language)
//  - All field reads/writes use lang-prefixed keys (edit_zh_xxx / edit_en_xxx)
//  - switchAdminLang fully rewrites button styles (no fragile string replace)
//  - switchEditLang reloads all form fields in the selected language
//  - Site default language setting (auto / zh / en)
//  - Migrate legacy edit_xxx keys to edit_zh_xxx on first load
//  - hydrateFromServerData handles [] vs {} correctly

const ADMIN_SESSION_KEY = 'adminLoggedIn';

// ── Lockout timer (display only — rate limiting is server-side) ───
function updateLockoutTimer(retryAfterSecs) {
  const lockEl = document.getElementById('lockoutMsg');
  const btnEl  = document.getElementById('loginBtn');
  if (!retryAfterSecs) {
    if (lockEl) lockEl.style.display = 'none';
    if (btnEl)  btnEl.disabled = false;
    return;
  }
  let remaining = retryAfterSecs;
  if (lockEl) lockEl.style.display = 'block';
  if (btnEl)  btnEl.disabled = true;
  const tick = () => {
    const m = Math.floor(remaining / 60), s = String(remaining % 60).padStart(2, '0');
    if (lockEl) lockEl.textContent = adminLang === 'en'
      ? `Account locked. Try again in ${m}:${s}.`
      : `账户已锁定，请在 ${m}:${s} 后重试`;
    if (remaining-- > 0) setTimeout(tick, 1000);
    else updateLockoutTimer(0);
  };
  tick();
}

// ── Admin UI language (controls admin interface language) ─────────
// Priority: stored preference → browser language → English fallback
// A US user who has never visited gets English. A Chinese user gets Chinese.
function detectAdminLang() {
  const stored = localStorage.getItem('adminLang');
  if (stored === 'zh' || stored === 'en') return stored;
  const browser = (navigator.language || navigator.userLanguage || '').toLowerCase();
  return browser.startsWith('zh') ? 'zh' : 'en';
}
let adminLang = detectAdminLang();

// ── Edit language (controls which language's content is being edited)
let editLang  = localStorage.getItem('adminEditLang') || adminLang;

const adminI18n = {
  zh: {
    uiLang:'界面语言', editLang:'编辑语言', editLangHint:'右侧编辑的是该语言的前台内容',
    save:'💾 保存更改', preview:'👁 预览',
    home:'首页', products:'产品介绍', about:'关于我们', contact:'联系我们',
    buttons:'按钮管理', settings:'网站设置', theme:'主题颜色', password:'修改密码',
    update:'检查更新',
    resetConfirm:'确定重置所有内容为默认值吗？此操作不可撤销！',
    saveOk:'✅ 保存并同步成功！', saveFail:'⚠ 本地已保存，服务器同步失败',
    tokenExpired:'登录已过期，请重新登录',
    themeColorsSaved:'✅ 主题颜色已保存', themeColorsReset:'已重置为默认颜色',
    themeColorsSaveFail:'颜色已保存（同步失败）',
    editingZh:'正在编辑：中文内容', editingEn:'正在编辑：英文内容',
    logoutBtn:'退出登录', versionLabel:'版本',
    langZhLabel:'中文', langEnLabel:'英文',
    editLangZhLabel:'中文', editLangEnLabel:'英文',
    previewBtn:'👁 预览页面', saveBtn:'💾 保存更改',
    loginTitle:'管理后台登录', loginSub:'请输入管理员密码以进入编辑模式',
    loginPwdLabel:'管理员密码', loginPwdPlh:'请输入密码', loginBtn:'登 录',
    loginHint:'默认密码：admin123（登录后请立即修改）',
    loginErrLock:'连续 5 次错误将锁定 15 分钟',
  },
  en: {
    uiLang:'UI Language', editLang:'Edit Language', editLangHint:'Right panel edits front-end content in this language',
    save:'💾 Save Changes', preview:'👁 Preview',
    home:'Home', products:'Products', about:'About Us', contact:'Contact',
    buttons:'Buttons', settings:'Settings', theme:'Theme', password:'Password',
    update:'Check Updates',
    resetConfirm:'Reset all content to defaults? This cannot be undone!',
    saveOk:'✅ Saved & synced!', saveFail:'⚠ Saved locally. Server sync failed.',
    tokenExpired:'Session expired. Please log in again.',
    themeColorsSaved:'✅ Theme colors saved', themeColorsReset:'Reset to default colors',
    themeColorsSaveFail:'Saved locally (sync failed)',
    editingZh:'Editing: Chinese content', editingEn:'Editing: English content',
    logoutBtn:'Sign Out', versionLabel:'Version',
    langZhLabel:'Chinese', langEnLabel:'English',
    editLangZhLabel:'Chinese', editLangEnLabel:'English',
    previewBtn:'👁 Preview', saveBtn:'💾 Save Changes',
    loginTitle:'Admin Login', loginSub:'Enter the admin password to access the editor',
    loginPwdLabel:'Password', loginPwdPlh:'Enter password', loginBtn:'Log In',
    loginHint:'Default password: admin123 — change immediately after login',
    loginErrLock:'5 consecutive failures will lock the account for 15 minutes',
  }
};
function t(k) { return (adminI18n[adminLang]||adminI18n.zh)[k] || k; }

// ── Complete admin UI strings for all field labels, headings, buttons ─
const adminUIStrings = {
  zh: {
    // Page title
    adminPageTitle: '管理后台 | GlobalTrade Admin',
    // Sidebar
    secPages: '页面内容', secSystem: '系统设置',
    // Home page
    pageHomeTitle: '首页内容管理',
    heroCard: 'Hero 横幅', heroTag: '标签文字', heroTitle: '主标题', heroDesc: '副标题描述',
    heroBtn1: '按钮1文字', heroBtn2: '按钮2文字', heroBgImg: 'Hero 背景图片',
    statsCard: '统计数据栏',
    statsYearsNum: '年份数字（如 20+）', statsYearsLabel: '年份标签',
    statsCountriesNum: '国家数字', statsCountriesLabel: '国家标签',
    statsClientsNum: '客户数字', statsClientsLabel: '客户标签',
    statsProductsNum: '产品数字', statsProductsLabel: '产品标签',
    featuresCard: '优势特色区域', featuresTitle: '区域标题', featuresSub: '区域副标题',
    feat1Title: '特色1 标题', feat1Desc: '特色1 描述',
    feat2Title: '特色2 标题', feat2Desc: '特色2 描述',
    feat3Title: '特色3 标题', feat3Desc: '特色3 描述',
    feat4Title: '特色4 标题', feat4Desc: '特色4 描述',
    featuredCard: '精选产品（首页展示的3个预览产品）',
    featuredNote: '这3个产品仅用于首页展示，完整产品请在"产品介绍"页面管理。',
    fp1Cat: '产品1 分类标签', fp1Name: '产品1 名称', fp1Desc: '产品1 描述',
    fp2Cat: '产品2 分类标签', fp2Name: '产品2 名称', fp2Desc: '产品2 描述',
    fp3Cat: '产品3 分类标签', fp3Name: '产品3 名称', fp3Desc: '产品3 描述',
    ctaCard: 'CTA 行动号召横幅', ctaTitle: '标题', ctaDesc: '描述',
    ctaBtn: '按钮文字', ctaBgImg: '背景图片',
    // Products page
    pageProductsTitle: '产品介绍页管理', productsHeroImg: '产品页 Hero 图片',
    productsMgmt: '产品分类与产品管理', addCategory: '＋ 添加分类',
    productsNote: '• 分类数量最少1个 | • 每个分类产品数量最少1个 | • 支持中英双语',
    // About page
    pageAboutTitle: '关于我们页面管理', pageHeroImg: '页面 Hero 图片',
    storyCard: '公司故事', storyTitle: '故事主标题',
    storyP1: '段落1', storyP2: '段落2', storyP3: '段落3', storyImg: '故事配图',
    missionCard: '使命与价值观', missionAreaTitle: '使命与价值观 区域标题',
    visionTitle: '愿景 标题', visionContent: '愿景 内容',
    missionTitle: '使命 标题', missionContent: '使命 内容',
    valuesTitle: '价值观 标题', valuesContent: '价值观 内容',
    teamCard: '核心团队', teamNote: '小型公司可将团队介绍部分文字改为实际负责人信息，或直接修改文字内容。',
    member1Name: '成员1 姓名', member1Role: '成员1 职位', member1Bio: '成员1 简介',
    member2Name: '成员2 姓名', member2Role: '成员2 职位', member2Bio: '成员2 简介',
    member3Name: '成员3 姓名', member3Role: '成员3 职位', member3Bio: '成员3 简介',
    certCard: '荣誉资质', cert1: '资质1', cert2: '资质2', cert3: '资质3', cert4: '资质4',
    // Contact page
    pageContactTitle: '联系我们页面管理', contactInfoCard: '联系信息',
    contactAreaTitle: '区域标题', contactDesc: '描述文字',
    contactAddress: '公司地址', contactPhone: '联系电话',
    contactEmail: '电子邮件', contactHours: '工作时间',
    socialCard: '社交媒体按钮', social1: '按钮1 文字', social2: '按钮2 文字', social3: '按钮3 文字',
    // Settings page
    pageSettingsTitle: '网站全局设置',
    siteLangCard: '🌐 网站默认语言', siteLangDesc: '此设置决定陌生访客第一次打开网站看到的语言。访客主动切换语言后，下次打开会保持他自己的选择。',
    langAutoTitle: '自动识别（推荐）', langAutoDesc: '根据访客浏览器语言自动判断\n中文浏览器→中文，其他→英文',
    langZhTitle: '默认中文', langZhDesc: '所有访客首次打开显示中文\n适合主要面向中文市场的网站',
    langEnTitle: '默认英文', langEnDesc: '所有访客首次打开显示英文\n适合主要面向英文市场的网站',
    saveLangBtn: '保存语言设置', langTip: '💡 建议：外贸网站通常选「自动识别」——中国客户看中文，海外客户看英文，双方体验最佳。',
    logoCard: '品牌 Logo', logoNote: 'Logo 图片和标题文字二选一：上传图片后将隐藏文字 Logo。浏览器标签页 Favicon 为独立设置，可使用不同图片。',
    logoText: 'Logo 文字', logoImg: 'Logo 图片（替代文字 Logo）',
    uploadLogo: '上传Logo', clearLogo: '清除Logo图片',
    faviconLabel: '浏览器标签页 Favicon（独立设置，建议正方形图标）', uploadFavicon: '上传Favicon',
    footerCard: '页脚信息', footerTagline: '页脚标语', footerCopy: '版权文字',
    footerEmail: '页脚邮箱', footerPhone: '页脚电话', footerAddress: '页脚地址',
    dataCard: '数据管理', dataNote: '所有内容存储在浏览器本地。建议定期导出备份，换设备或清理浏览器数据后可通过导入恢复。',
    exportBtn: '📤 导出所有数据 (JSON)', importBtn: '📥 导入数据 (JSON)', resetBtn: '🗑 重置为默认数据',
    // Buttons page
    pageButtonsTitle: '按钮管理', btnMgmtCard: '全站按钮跳转与动作设置',
    btnMgmtDesc: '为每个按钮选择点击后的动作：跳转页面（从现有页面中选择）或 发送邮件（输入邮箱地址）或 外部链接（输入完整URL）。',
    saveBtnActions: '💾 保存所有按钮设置',
    // Theme page
    pageThemeTitle: '主题颜色设置', themeCard: '网站主色调',
    themeNote: '修改后保存，刷新前台页面即可看到效果。颜色会应用到导航栏、页脚、按钮等全部主色区域。',
    primaryColorLabel: '主色（深色背景，如导航/页脚）', accentColorLabel: '强调色（金色按钮、高亮、装饰）',
    saveColorsBtn: '💾 保存颜色方案', resetColorsBtn: '↩ 恢复默认颜色',
    presetColorsLabel: '🎨 推荐颜色方案快速选择：',
    // Password page
    pagePasswordTitle: '修改密码', pwdNote: '密码存储在当前浏览器本地。建议设置8位以上、包含字母和数字的密码。',
    curPwdLabel: '当前密码', newPwdLabel: '新密码（至少6位）', confirmPwdLabel: '确认新密码',
    changePwdBtn: '修改密码',
    // Update page
    updateDockerNote: '本项目使用 Docker 容器化部署，更新需要在服务器 SSH 中执行以下命令。网站数据（site-data.json）不会丢失，已通过 Volume 挂载保护。',
    sshCmdLabel: 'SSH 更新命令', cfCacheNote: '登录 Cloudflare → 你的域名 → Caching → Purge Everything 清除 CDN 缓存。建议在 Cache Rules 中将 *.js 和 *.css 设为 Bypass cache，避免下次更新再遇到同样问题。',
    customPathTitle: '💡 如果安装目录不同', customPathDesc: '请将第一行中的路径替换为你的实际安装目录：', applyPathBtn: '应用',
    // Shared image controls
    imgUrl: '图片URL', orDivider: '或', uploadImg: '上传图片', applyUrl: '应用URL',
    logoImgUrl: 'Logo图片URL（留空使用文字Logo）', faviconUrl: 'Favicon图片URL',
    customPathPlh: '/opt/1panel/apps/Simple-Business-Websitebuilder',
    viewReleasesLink: '查看 GitHub 完整发布历史 →',
    copyCmdBtn: '📋 复制命令',
    cfWarningTitle: '⚠ 如果更新后页面没有变化（Cloudflare 用户）',
  },
  en: {
    adminPageTitle: 'Admin Panel | GlobalTrade',
    secPages: 'Pages', secSystem: 'System',
    pageHomeTitle: 'Home Page',
    heroCard: 'Hero Banner', heroTag: 'Tag Text', heroTitle: 'Headline', heroDesc: 'Subheadline',
    heroBtn1: 'Button 1 Text', heroBtn2: 'Button 2 Text', heroBgImg: 'Hero Background Image',
    statsCard: 'Stats Bar',
    statsYearsNum: 'Years Number (e.g. 20+)', statsYearsLabel: 'Years Label',
    statsCountriesNum: 'Countries Number', statsCountriesLabel: 'Countries Label',
    statsClientsNum: 'Clients Number', statsClientsLabel: 'Clients Label',
    statsProductsNum: 'Products Number', statsProductsLabel: 'Products Label',
    featuresCard: 'Advantages Section', featuresTitle: 'Section Title', featuresSub: 'Section Subtitle',
    feat1Title: 'Feature 1 Title', feat1Desc: 'Feature 1 Description',
    feat2Title: 'Feature 2 Title', feat2Desc: 'Feature 2 Description',
    feat3Title: 'Feature 3 Title', feat3Desc: 'Feature 3 Description',
    feat4Title: 'Feature 4 Title', feat4Desc: 'Feature 4 Description',
    featuredCard: 'Featured Products (3 preview cards on Home page)',
    featuredNote: 'These 3 products are only shown on the Home page. Manage all products in the Products section.',
    fp1Cat: 'Product 1 Category', fp1Name: 'Product 1 Name', fp1Desc: 'Product 1 Description',
    fp2Cat: 'Product 2 Category', fp2Name: 'Product 2 Name', fp2Desc: 'Product 2 Description',
    fp3Cat: 'Product 3 Category', fp3Name: 'Product 3 Name', fp3Desc: 'Product 3 Description',
    ctaCard: 'CTA Banner', ctaTitle: 'Title', ctaDesc: 'Description',
    ctaBtn: 'Button Text', ctaBgImg: 'Background Image',
    pageProductsTitle: 'Products Page', productsHeroImg: 'Products Page Hero Image',
    productsMgmt: 'Categories & Products', addCategory: '＋ Add Category',
    productsNote: '• Min. 1 category | • Min. 1 product per category | • Bilingual support',
    pageAboutTitle: 'About Us Page', pageHeroImg: 'Page Hero Image',
    storyCard: 'Company Story', storyTitle: 'Story Headline',
    storyP1: 'Paragraph 1', storyP2: 'Paragraph 2', storyP3: 'Paragraph 3', storyImg: 'Story Image',
    missionCard: 'Mission & Values', missionAreaTitle: 'Section Title',
    visionTitle: 'Vision Title', visionContent: 'Vision Text',
    missionTitle: 'Mission Title', missionContent: 'Mission Text',
    valuesTitle: 'Values Title', valuesContent: 'Values Text',
    teamCard: 'Core Team', teamNote: 'Update with your actual team members, or modify the text to fit your company size.',
    member1Name: 'Member 1 Name', member1Role: 'Member 1 Title', member1Bio: 'Member 1 Bio',
    member2Name: 'Member 2 Name', member2Role: 'Member 2 Title', member2Bio: 'Member 2 Bio',
    member3Name: 'Member 3 Name', member3Role: 'Member 3 Title', member3Bio: 'Member 3 Bio',
    certCard: 'Certifications', cert1: 'Cert 1', cert2: 'Cert 2', cert3: 'Cert 3', cert4: 'Cert 4',
    pageContactTitle: 'Contact Page', contactInfoCard: 'Contact Information',
    contactAreaTitle: 'Section Title', contactDesc: 'Description Text',
    contactAddress: 'Company Address', contactPhone: 'Phone Number',
    contactEmail: 'Email Address', contactHours: 'Business Hours',
    socialCard: 'Social Media Buttons', social1: 'Button 1 Text', social2: 'Button 2 Text', social3: 'Button 3 Text',
    pageSettingsTitle: 'Site Settings',
    siteLangCard: '🌐 Site Default Language', siteLangDesc: 'This setting determines the language first-time visitors see. Visitors who manually switch language will keep their choice on return.',
    langAutoTitle: 'Auto-detect (Recommended)', langAutoDesc: 'Detects browser language automatically.\nChinese browser → Chinese; others → English',
    langZhTitle: 'Default Chinese', langZhDesc: 'All first-time visitors see Chinese.\nBest for sites targeting Chinese-speaking markets.',
    langEnTitle: 'Default English', langEnDesc: 'All first-time visitors see English.\nBest for sites targeting English-speaking markets.',
    saveLangBtn: 'Save Language Setting', langTip: '💡 Tip: For international trade sites, Auto-detect is ideal — Chinese visitors see Chinese, international visitors see English.',
    logoCard: 'Brand Logo', logoNote: 'Logo image or text — if you upload an image, the text logo is hidden. Favicon is a separate setting.',
    logoText: 'Logo Text', logoImg: 'Logo Image (replaces text logo)',
    uploadLogo: 'Upload Logo', clearLogo: 'Clear Logo Image',
    faviconLabel: 'Browser Tab Favicon (square image recommended)', uploadFavicon: 'Upload Favicon',
    footerCard: 'Footer', footerTagline: 'Footer Tagline', footerCopy: 'Copyright Text',
    footerEmail: 'Footer Email', footerPhone: 'Footer Phone', footerAddress: 'Footer Address',
    dataCard: 'Data Management', dataNote: 'All content is stored in the browser. Export a backup regularly. Use Import to restore on a new device.',
    exportBtn: '📤 Export All Data (JSON)', importBtn: '📥 Import Data (JSON)', resetBtn: '🗑 Reset to Defaults',
    pageButtonsTitle: 'Button Manager', btnMgmtCard: 'Button Actions',
    btnMgmtDesc: 'Set the action for each button: Page Jump (select from existing pages), Send Email (enter address), or External Link (full URL).',
    saveBtnActions: '💾 Save Button Settings',
    pageThemeTitle: 'Theme Colors', themeCard: 'Color Scheme',
    themeNote: 'Save changes then refresh the front-end to see the effect. Colors apply to the header, footer, buttons, and all accent areas.',
    primaryColorLabel: 'Primary Color (dark backgrounds — header, footer)',
    accentColorLabel: 'Accent Color (buttons, highlights, decorations)',
    saveColorsBtn: '💾 Save Colors', resetColorsBtn: '↩ Reset to Default',
    presetColorsLabel: '🎨 Quick presets:',
    pagePasswordTitle: 'Change Password', pwdNote: 'Password is stored in the browser. We recommend 8+ characters with letters and numbers.',
    curPwdLabel: 'Current Password', newPwdLabel: 'New Password (min. 6 characters)', confirmPwdLabel: 'Confirm New Password',
    changePwdBtn: 'Change Password',
    updateDockerNote: 'This project runs in Docker. Updates require SSH access to run the commands below. Your site data (site-data.json) is preserved via volume mount.',
    sshCmdLabel: 'SSH Update Command', cfCacheNote: 'Log in to Cloudflare → your domain → Caching → Purge Everything. To prevent this in future, add a Cache Rule to Bypass cache for *.js and *.css.',
    customPathTitle: '💡 Custom install path?', customPathDesc: 'Replace the first line with your actual install directory:', applyPathBtn: 'Apply',
    viewReleasesLink: 'View full release history on GitHub →',
    copyCmdBtn: '📋 Copy Command',
    cfWarningTitle: '⚠ If page still shows old content after update (Cloudflare users)',
    imgUrl: 'Image URL', orDivider: 'or', uploadImg: 'Upload Image', applyUrl: 'Apply URL',
    logoImgUrl: 'Logo image URL (leave blank to use text logo)', faviconUrl: 'Favicon image URL',
    customPathPlh: '/opt/1panel/apps/Simple-Business-Websitebuilder',
  }
};

// ── Translate all admin UI elements with data-ail attribute ───────
function translateAdminUI() {
  const s = adminUIStrings[adminLang] || adminUIStrings.en;
  const t2 = adminI18n[adminLang] || adminI18n.en;

  // Translate text content
  document.querySelectorAll('[data-ail]').forEach(el => {
    const key = el.getAttribute('data-ail');
    if (s[key] !== undefined) el.textContent = s[key];
    else if (t2[key] !== undefined) el.textContent = t2[key];
  });

  // Translate nav link labels (icon + text)
  const navLabels = { home:'home', products:'products', about:'about', contact:'contact',
                      buttons:'buttons', settings:'settings', theme:'theme',
                      password:'password', update:'update', logoutBtn:'logoutBtn' };
  document.querySelectorAll('[data-ail-nav]').forEach(el => {
    const key = el.getAttribute('data-ail-nav');
    const icon = el.textContent.trim().slice(0, 2);  // preserve emoji
    if (t2[key]) el.textContent = icon + ' ' + t2[key];
  });

  // Translate placeholders
  document.querySelectorAll('[data-ail-ph]').forEach(el => {
    const key = el.getAttribute('data-ail-ph');
    if (s[key] !== undefined) el.placeholder = s[key];
  });

  // Page title
  if (s.adminPageTitle) document.title = s.adminPageTitle;
}

// ── Translate login page elements ─────────────────────────────────
function translateLoginPage() {
  const ids = {
    loginTitle: 'loginTitle', loginSub: 'loginSub',
    loginPwdLabel: 'loginPwdLabel', loginBtn: 'loginBtn',
    loginHint: 'loginHint', loginErrLockMsg: 'loginErrLockMsg'
  };
  Object.entries(ids).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === 'loginHint') {
      el.innerHTML = adminLang === 'en'
        ? 'Default password: <code>admin123</code> — change immediately after login'
        : '默认密码：<code>admin123</code>（登录后请立即修改）';
    } else if (id === 'loginErrLockMsg') {
      el.textContent = '🔒 ' + t('loginErrLock');
    } else if (id === 'loginBtn') {
      el.textContent = adminLang === 'en' ? 'Log In' : '登 录';
    } else {
      el.textContent = t(key);
    }
  });
  const pwdInput = document.getElementById('adminPassword');
  if (pwdInput) pwdInput.placeholder = t('loginPwdPlh');
  const loginBtnEl = document.getElementById('loginBtn');
  if (loginBtnEl) loginBtnEl.textContent = adminLang === 'en' ? 'Log In' : '登 录';
}

// ── Switch admin UI language ──────────────────────────────────────
function switchAdminLang(lang) {
  adminLang = lang;
  localStorage.setItem('adminLang', lang);

  // UI language toggle buttons
  const btnZh = document.getElementById('adminLangZh');
  const btnEn = document.getElementById('adminLangEn');
  if (btnZh) {
    btnZh.style.background = lang==='zh' ? '#0a1628' : 'transparent';
    btnZh.style.color = lang==='zh' ? '#c9a84c' : '#666';
    btnZh.textContent = lang==='zh' ? '中文' : 'Chinese';
  }
  if (btnEn) {
    btnEn.style.background = lang==='en' ? '#0a1628' : 'transparent';
    btnEn.style.color = lang==='en' ? '#c9a84c' : '#666';
    btnEn.textContent = lang==='en' ? 'English' : '英文';
  }

  // Section labels
  const uiLangLabel  = document.getElementById('uiLangLabel');
  const editLangLabel= document.getElementById('editLangLabel');
  const editLangHint = document.getElementById('editLangHint');
  if (uiLangLabel)   uiLangLabel.textContent  = t('uiLang');
  if (editLangLabel) editLangLabel.textContent = t('editLang');
  if (editLangHint)  editLangHint.textContent  = t('editLangHint');

  // Edit language buttons text
  const elZh = document.getElementById('editLangZh');
  const elEn = document.getElementById('editLangEn');
  if (elZh) elZh.innerHTML = lang==='zh' ? '🇨🇳 中文' : '🇨🇳 Chinese';
  if (elEn) elEn.innerHTML = lang==='zh' ? '🇬🇧 英文' : '🇬🇧 English';

  // Re-apply edit lang indicator with new UI language
  switchEditLang(editLang);

  // Topbar buttons
  const previewBtn = document.getElementById('topPreviewBtn');
  const saveBtn    = document.getElementById('topSaveBtn');
  if (previewBtn) previewBtn.textContent = t('previewBtn');
  if (saveBtn)    saveBtn.textContent    = t('saveBtn');

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.textContent = t('logoutBtn');

  // Sidebar nav
  const navMap = {
    home:['首页','Home'], products:['产品介绍','Products'], about:['关于我们','About Us'],
    contact:['联系我们','Contact'], buttons:['按钮管理','Buttons'],
    settings:['网站设置','Settings'], theme:['主题颜色','Theme'],
    password:['修改密码','Password'], update:['检查更新','Check Updates']
  };
  const emojiMap = {home:'🏠',products:'📦',about:'👥',contact:'✉',buttons:'🔘',settings:'⚙',theme:'🎨',password:'🔒',update:'🔄'};
  document.querySelectorAll('.sidebar-link[onclick]').forEach(a => {
    const m = a.getAttribute('onclick')?.match(/switchPage\('(\w+)'\)/);
    if (!m) return;
    const pair = navMap[m[1]]; const emoji = emojiMap[m[1]] || '';
    if (pair) a.textContent = emoji + ' ' + pair[lang==='en'?1:0];
  });

  // Breadcrumb
  const bc = document.getElementById('adminBreadcrumb');
  if (bc) {
    const bcZh = {home:'首页管理',products:'产品管理',about:'关于我们',contact:'联系我们',buttons:'按钮管理',settings:'网站设置',theme:'主题颜色',password:'修改密码',update:'检查更新'};
    const bcEn = {home:'Home',products:'Products',about:'About Us',contact:'Contact',buttons:'Buttons',settings:'Settings',theme:'Theme',password:'Password',update:'Check Updates'};
    const prefix = lang==='en' ? 'Admin / ' : '管理后台 / ';
    // Find current page key from active link
    const active = document.querySelector('.sidebar-link.active[onclick]');
    const m = active?.getAttribute('onclick')?.match(/switchPage\('(\w+)'\)/);
    if (m) bc.textContent = prefix + (lang==='en' ? (bcEn[m[1]]||m[1]) : (bcZh[m[1]]||m[1]));
  }

  loadAllFields();
  translateLoginPage();
  translateAdminUI();
}

// ── Switch edit language (what content is being edited) ───────────
function switchEditLang(lang) {
  editLang = lang;
  localStorage.setItem('adminEditLang', lang);

  const btnZh = document.getElementById('editLangZh');
  const btnEn = document.getElementById('editLangEn');
  if (btnZh) { btnZh.style.background = lang==='zh' ? '#c9a84c' : 'transparent'; btnZh.style.color = lang==='zh' ? '#0a1628' : '#888'; btnZh.style.borderColor = lang==='zh'?'#c9a84c':'#444'; }
  if (btnEn) { btnEn.style.background = lang==='en' ? '#c9a84c' : 'transparent'; btnEn.style.color = lang==='en' ? '#0a1628' : '#888'; btnEn.style.borderColor = lang==='en'?'#c9a84c':'#444'; }

  const indicator = document.getElementById('editLangIndicator');
  if (indicator) {
    indicator.textContent = lang === 'zh' ? t('editingZh') : t('editingEn');
    indicator.style.background = lang === 'zh' ? '#fff3d0' : '#d0e8ff';
    indicator.style.color      = lang === 'zh' ? '#8b6914' : '#1a5276';
  }

  // Reload all form fields with content for the newly selected language
  loadAllFields();
  if (currentPage === 'buttons') renderBtnEditor();
}

// ── DEFAULTS ─────────────────────────────────────────────────────
const DEFAULTS = {
  'hero.tag':         { zh:'全球领先的贸易伙伴',         en:'Your Global Trade Partner' },
  'hero.title':       { zh:'连接世界 共创未来',           en:'Connecting the World, Building the Future' },
  'hero.desc':        { zh:'专注国际贸易20余年，为全球客户提供优质产品与一站式供应链解决方案', en:'Over 20 years in international trade, delivering premium products and end-to-end supply chain solutions worldwide.' },
  'hero.btn1':        { zh:'探索产品',                   en:'Explore Products' },
  'hero.btn2':        { zh:'立即联系',                   en:'Contact Us' },
  'stats.years':      { zh:'20+', en:'20+' },
  'stats.yearsLabel': { zh:'年行业经验',                  en:'Years of Experience' },
  'stats.countries':  { zh:'80+', en:'80+' },
  'stats.countriesLabel':{ zh:'覆盖国家地区',             en:'Countries & Regions' },
  'stats.clients':    { zh:'5000+', en:'5000+' },
  'stats.clientsLabel':  { zh:'全球合作客户',             en:'Global Partners' },
  'stats.products':   { zh:'1200+', en:'1200+' },
  'stats.productsLabel': { zh:'产品品类',                 en:'Product Categories' },
  'features.title':   { zh:'为何选择我们',                en:'Our Advantages' },
  'features.sub':     { zh:'多年深耕国际贸易领域，打造值得信赖的全球供应链', en:'Decades of expertise in global trade, building a trusted worldwide supply chain.' },
  'feat1.title':      { zh:'全球网络',    en:'Global Network' },
  'feat1.desc':       { zh:'覆盖80+国家的完善贸易网络，本地化服务团队随时响应您的需求', en:'A comprehensive trade network spanning 80+ countries with local teams ready to serve you.' },
  'feat2.title':      { zh:'品质保障',    en:'Quality Assurance' },
  'feat2.desc':       { zh:'严苛的质量管控体系，通过ISO9001认证，每一件产品都经过严格检测', en:'Rigorous quality controls with ISO 9001 certification. Every product undergoes strict inspection.' },
  'feat3.title':      { zh:'高效交付',    en:'Efficient Delivery' },
  'feat3.desc':       { zh:'完善的物流体系与仓储网络，确保订单准时交付，响应迅速', en:'A robust logistics and warehousing network ensures timely delivery and rapid response.' },
  'feat4.title':      { zh:'专业服务',    en:'Professional Service' },
  'feat4.desc':       { zh:'经验丰富的贸易专家团队，提供从询价到售后的全流程专业支持', en:'Experienced trade experts providing end-to-end support from inquiry to after-sales.' },
  'cta.title':        { zh:'准备好开始合作了吗？',         en:'Ready to Partner With Us?' },
  'cta.desc':         { zh:'立即联系我们的专业团队，获取定制化贸易解决方案', en:'Contact our expert team for a customized trade solution.' },
  'cta.btn':          { zh:'免费咨询',    en:'Free Consultation' },
  'logo.text':        { zh:'GlobalTrade Co.', en:'GlobalTrade Co.' },
  'footer.tagline':   { zh:'连接全球，共创价值', en:'Connecting the Globe, Creating Value' },
  'footer.copy':      { zh:'© 2024 GlobalTrade Co. All Rights Reserved.', en:'© 2024 GlobalTrade Co. All Rights Reserved.' },
  'footer.email':     { zh:'✉ info@globaltrade.com', en:'✉ info@globaltrade.com' },
  'footer.phone':     { zh:'📞 +86 400-888-8888', en:'📞 +86 400-888-8888' },
  'footer.address':   { zh:'📍 上海市浦东新区贸易大厦18楼', en:'📍 18F Trade Tower, Pudong New Area, Shanghai' },
  'about.storyTitle': { zh:'从一粒种子到参天大树', en:'From a Seed to a Towering Tree' },
  'about.years':      { zh:'20', en:'20' },
  'about.storyP1':    { zh:'GlobalTrade Co. 成立于2004年，总部位于上海。二十年来，我们始终坚守"诚信、专业、创新"的核心价值观，从一家小型贸易公司成长为覆盖全球80余个国家和地区的综合性贸易集团。', en:'GlobalTrade Co. was founded in 2004 and is headquartered in Shanghai. Over twenty years, we have upheld the core values of integrity, professionalism, and innovation.' },
  'about.storyP2':    { zh:'我们拥有超过500名专业贸易团队成员，在亚洲、欧洲、北美及中东设有区域办公室，为全球5000余家合作伙伴提供稳定、高效的供应链解决方案。', en:'We have more than 500 professional trade team members and regional offices in Asia, Europe, North America, and the Middle East.' },
  'about.storyP3':    { zh:'面向未来，我们将持续深化数字化贸易能力，以技术赋能贸易，为全球客户创造更大价值。', en:'Looking ahead, we will continue to deepen our digital trade capabilities, empowering trade with technology.' },
  'about.visionText': { zh:'成为最受信赖的全球贸易伙伴，让世界贸易更简单、更高效', en:'To be the most trusted global trade partner, making world trade simpler and more efficient.' },
  'about.missionText':{ zh:'通过专业服务和创新解决方案，连接全球供需，创造共同价值', en:'To connect global supply and demand through professional services and innovative solutions.' },
  'about.valuesText': { zh:'诚信为本 · 专业精进 · 创新驱动 · 共赢发展', en:'Integrity · Professionalism · Innovation · Mutual Success' },
  'about.vision':     { zh:'愿景', en:'Vision' },
  'about.mission':    { zh:'使命', en:'Mission' },
  'about.values':     { zh:'价值观', en:'Values' },
  'team1.name':       { zh:'张明远',    en:'Michael Zhang' },
  'team1.role':       { zh:'创始人 & CEO', en:'Founder & CEO' },
  'team1.bio':        { zh:'20年国际贸易经验，前500强企业高管，主导公司全球战略布局', en:'20 years of international trade experience, former Fortune 500 executive leading global strategy.' },
  'team2.name':       { zh:'李雪婷',    en:'Lisa Li' },
  'team2.role':       { zh:'首席运营官 COO', en:'Chief Operating Officer' },
  'team2.bio':        { zh:'供应链管理专家，主导公司运营体系优化，推动数字化转型', en:'Supply chain management expert leading operational optimization and digital transformation.' },
  'team3.name':       { zh:'王志远',    en:'Victor Wang' },
  'team3.role':       { zh:'技术总监 CTO', en:'Chief Technology Officer' },
  'team3.bio':        { zh:'资深技术专家，带领技术团队打造智慧贸易平台，赋能业务增长', en:'Senior technology expert leading development of intelligent trade platforms.' },
  'cert1':            { zh:'ISO 9001:2015 质量管理体系认证', en:'ISO 9001:2015 Quality Management System' },
  'cert2':            { zh:'ISO 14001 环境管理体系认证', en:'ISO 14001 Environmental Management System' },
  'cert3':            { zh:'海关AEO高级认证企业', en:'Customs AEO Advanced Certified Enterprise' },
  'cert4':            { zh:'中国对外贸易质量奖', en:'China Foreign Trade Quality Award' },
  'contact.infoTitle':{ zh:'与我们取得联系', en:'Get In Touch' },
  'contact.infoDesc': { zh:'无论您是寻找优质产品、了解合作方式，还是需要定制化解决方案，我们的专业团队随时准备为您服务。', en:'Whether you are looking for quality products, partnership opportunities, or customized solutions, our professional team is always ready to serve you.' },
  'contact.addressVal':{ zh:'上海市浦东新区张江高科技园区贸易大厦18楼', en:'18F Trade Tower, Zhangjiang Hi-Tech Park, Pudong, Shanghai' },
  'contact.phoneVal': { zh:'+86 400-888-8888', en:'+86 400-888-8888' },
  'contact.emailVal': { zh:'info@globaltrade.com', en:'info@globaltrade.com' },
  'contact.hoursVal': { zh:'周一至周五 9:00 - 18:00 (UTC+8)', en:'Mon–Fri 9:00 AM – 6:00 PM (UTC+8)' },
  'social.wechat':    { zh:'WeChat', en:'WeChat' },
  'social.linkedin':  { zh:'LinkedIn', en:'LinkedIn' },
  'social.whatsapp':  { zh:'WhatsApp', en:'WhatsApp' },
  'fp1.cat':  { zh:'电子产品', en:'Electronics' },
  'fp1.name': { zh:'智能控制模块', en:'Smart Control Module' },
  'fp1.desc': { zh:'高性能工业级智能控制模块，适用于各类自动化场景', en:'High-performance industrial smart control module for various automation applications.' },
  'fp2.cat':  { zh:'机械配件', en:'Mechanical Parts' },
  'fp2.name': { zh:'精密轴承组件', en:'Precision Bearing Assembly' },
  'fp2.desc': { zh:'采用优质钢材，精密加工，耐磨耐用，适用于高负载环境', en:'Premium steel, precision machined, durable and wear-resistant.' },
  'fp3.cat':  { zh:'包装材料', en:'Packaging' },
  'fp3.name': { zh:'环保包装解决方案', en:'Eco Packaging Solutions' },
  'fp3.desc': { zh:'可降解材料，符合国际环保标准，助力绿色贸易', en:'Biodegradable materials meeting international environmental standards.' },
};

function getDefaultVal(key) {
  if (!DEFAULTS[key]) return '';
  return DEFAULTS[key][editLang] || DEFAULTS[key]['zh'] || '';
}

// Get field value: lang-specific stored → legacy stored (zh migration) → default
function getFieldVal(key) {
  // Try new lang-specific key
  const langKey = `edit_${editLang}_${key}`;
  const langVal = localStorage.getItem(langKey);
  if (langVal !== null) return langVal;
  // Legacy migration: old edit_xxx → zh
  if (editLang === 'zh') {
    const legacy = localStorage.getItem('edit_' + key);
    if (legacy !== null) return legacy;
  }
  return getDefaultVal(key);
}

function getImgVal(key) {
  // Images: try lang-specific, then shared
  const langVal = localStorage.getItem(`edit_img_${editLang}_${key}`);
  if (langVal) return langVal;
  const legacy = localStorage.getItem('edit_img_' + key);
  if (legacy) return legacy;
  return '';
}

// ── Init
let currentPage        = 'home';
let adminProductsData  = null;

function initAdmin() {
  fetch('/api/data', { credentials: 'same-origin' })
    .then(r => r.json())
    .then(data => {
      if (typeof hydrateFromServerData === 'function') hydrateFromServerData(data);
      // Apply site default lang setting to selector
      const siteLang = data.siteDefaultLang || localStorage.getItem('site.defaultLang') || 'auto';
      const sel = document.getElementById('siteDefaultLang');
      if (sel) sel.value = siteLang;
    })
    .catch(() => {})
    .finally(() => {
      adminProductsData = ProductsDB.load();
      loadAllFields();
      renderAdminCategories();
      applyThemePreview();
      switchAdminLang(adminLang);
      switchEditLang(editLang);
      translateAdminUI();
    });
}

// ── Load all admin form fields using current editLang
function loadAllFields() {
  document.querySelectorAll('[data-key]').forEach(el => {
    el.value = getFieldVal(el.getAttribute('data-key'));
  });

  // Image previews
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
    const prev   = document.getElementById('prev-' + key);
    const inp    = document.getElementById('f-' + key);
    if (prev) { prev.src = stored || fallback; }
    if (inp && stored) inp.value = stored;
  });

  // Theme colors
  const pc = document.getElementById('themeColorPrimary');
  const ac = document.getElementById('themeColorAccent');
  const ph = document.getElementById('themeColorPrimaryHex');
  const ah = document.getElementById('themeColorAccentHex');
  if (pc) { pc.value = localStorage.getItem('theme.primary') || '#0a1628'; if(ph) ph.value=pc.value; }
  if (ac) { ac.value = localStorage.getItem('theme.accent')  || '#c9a84c'; if(ah) ah.value=ac.value; }

  // Site default lang
  const siteLangSel = document.getElementById('siteDefaultLang');
  if (siteLangSel) siteLangSel.value = localStorage.getItem('site.defaultLang') || 'auto';
}

function handleUpload(input, key) {
  if (!input.files?.[0]) return;
  const r = new FileReader();
  r.onload = e => {
    const d = e.target.result;
    const f = document.getElementById('f-'+key); if(f) f.value=d;
    const p = document.getElementById('prev-'+key); if(p) p.src=d;
    // Shared assets (logo, favicon) stored without lang prefix
    if (key === 'logo.image' || key === 'site.favicon') {
      localStorage.setItem('edit_img_' + key, d);
    } else {
      localStorage.setItem(`edit_img_${editLang}_${key}`, d);
    }
  };
  r.readAsDataURL(input.files[0]);
}

function applyImgUrl(key) {
  const f = document.getElementById('f-'+key); if(!f||!f.value) return;
  const p = document.getElementById('prev-'+key); if(p) p.src=f.value;
  if (key === 'logo.image' || key === 'site.favicon') {
    localStorage.setItem('edit_img_' + key, f.value);
  } else {
    localStorage.setItem(`edit_img_${editLang}_${key}`, f.value);
  }
}

// ── Sync to server (session cookie sent automatically)
function syncAllToServer(onSuccess, onFail) {
  const data = {
    editableContent:{}, editableImages:{}, btnActions:{},
    productsData: adminProductsData || ProductsDB.load(),
    themeColors:{ primary: localStorage.getItem('theme.primary'), accent: localStorage.getItem('theme.accent') },
    siteDefaultLang: localStorage.getItem('site.defaultLang') || 'auto'
  };
  for (let i=0; i<localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k.startsWith('edit_img_'))   data.editableImages[k.replace('edit_img_','')] = localStorage.getItem(k);
    else if (k.startsWith('edit_'))  data.editableContent[k.replace('edit_','')]    = localStorage.getItem(k);
    else if (k.startsWith('btn_action_')) data.btnActions[k.replace('btn_action_','')] = localStorage.getItem(k);
  }

  fetch('/api/save', { method:'POST', headers:{'Content-Type':'application/json'},
    credentials: 'same-origin', body: JSON.stringify({ data }) })
  .then(r => r.json())
  .then(resp => {
    if (resp.status==='ok') { onSuccess && onSuccess(); }
    else if (resp.error==='unauthenticated') {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      showAdminToast(t('tokenExpired'), 'error');
      setTimeout(() => location.reload(), 2000);
    } else { onFail && onFail(resp.error); }
  })
  .catch(() => { onFail && onFail('network'); });
}

function saveAll() {
  // Save all visible form fields to lang-prefixed keys
  document.querySelectorAll('[data-key]').forEach(el => {
    const key = el.getAttribute('data-key');
    if (!el.value) return;
    // Shared keys (logo text, footer copy, etc.) — save without lang prefix for simplicity
    // These are brand-level items that should be same in both languages
    const sharedKeys = ['logo.text','footer.copy','footer.email','footer.phone','footer.address','footer.tagline'];
    if (sharedKeys.includes(key)) {
      localStorage.setItem('edit_' + key, el.value);
      localStorage.setItem(`edit_zh_${key}`, el.value);
      localStorage.setItem(`edit_en_${key}`, el.value);
    } else {
      localStorage.setItem(`edit_${editLang}_${key}`, el.value);
    }
  });
  // Save image fields
  document.querySelectorAll('[data-img-key]').forEach(el => {
    if (!el.value) return;
    const key = el.getAttribute('data-img-key');
    if (key === 'logo.image' || key === 'site.favicon') {
      localStorage.setItem('edit_img_' + key, el.value);
    } else {
      localStorage.setItem(`edit_img_${editLang}_${key}`, el.value);
    }
  });
  syncAllToServer(
    () => showAdminToast(t('saveOk'), 'success'),
    () => showAdminToast(t('saveFail'), 'error')
  );
}

// ── Theme
function applyThemePreview() {
  const p=document.getElementById('themeColorPrimary')?.value;
  const a=document.getElementById('themeColorAccent')?.value;
  const prev=document.getElementById('themePreview');
  if(prev&&p&&a){prev.style.background=`linear-gradient(135deg,${p},${a})`;prev.textContent=`Primary ${p}  ·  Accent ${a}`;prev.style.color='#fff';}
}
function saveThemeColors(){
  const p=document.getElementById('themeColorPrimary')?.value;
  const a=document.getElementById('themeColorAccent')?.value;
  if(p)localStorage.setItem('theme.primary',p);if(a)localStorage.setItem('theme.accent',a);
  syncAllToServer(()=>showAdminToast(t('themeColorsSaved'),'success'),()=>showAdminToast(t('themeColorsSaveFail'),'error'));
}
function resetThemeColors(){
  localStorage.removeItem('theme.primary');localStorage.removeItem('theme.accent');
  const pc=document.getElementById('themeColorPrimary');if(pc)pc.value='#0a1628';
  const ac=document.getElementById('themeColorAccent');if(ac)ac.value='#c9a84c';
  const ph=document.getElementById('themeColorPrimaryHex');if(ph)ph.value='#0a1628';
  const ah=document.getElementById('themeColorAccentHex');if(ah)ah.value='#c9a84c';
  applyThemePreview();showAdminToast(t('themeColorsReset'),'success');
}

// ── Site default language
function saveSiteDefaultLang() {
  const sel = document.getElementById('siteDefaultLang');
  if (!sel) return;
  localStorage.setItem('site.defaultLang', sel.value);
  syncAllToServer(
    () => showAdminToast(adminLang==='en'?'✅ Default language saved':'✅ 网站默认语言已保存并同步', 'success'),
    () => showAdminToast(adminLang==='en'?'Saved (sync failed)':'已保存（同步失败）', 'error')
  );
}

// ── Page switching
function switchPage(page) {
  currentPage = page;
  document.querySelectorAll('.admin-content').forEach(el => el.style.display='none');
  document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active'));
  const pageEl = document.getElementById('page-'+page);
  if (pageEl) pageEl.style.display='block';
  const links = document.querySelectorAll('.sidebar-link');
  const idx = {home:0,products:1,about:2,contact:3,buttons:4,settings:5,theme:6,password:7,update:8};
  if (links[idx[page]] !== undefined) links[idx[page]].classList.add('active');
  const bcZh={home:'首页管理',products:'产品管理',about:'关于我们',contact:'联系我们',buttons:'按钮管理',settings:'网站设置',theme:'主题颜色',password:'修改密码',update:'检查更新'};
  const bcEn={home:'Home',products:'Products',about:'About Us',contact:'Contact',buttons:'Buttons',settings:'Settings',theme:'Theme',password:'Password',update:'Check Updates'};
  const bcMap = adminLang==='en' ? bcEn : bcZh;
  const bcPrefix = adminLang==='en' ? 'Admin / ' : '管理后台 / ';
  document.getElementById('adminBreadcrumb').textContent=bcPrefix+(bcMap[page]||page);
  if (page==='products') renderAdminCategories();
  if (page==='buttons')  renderBtnEditor();
}

function previewPage() {
  const map={home:'index.html',products:'products.html',about:'about.html',contact:'contact.html'};
  window.open('../'+(map[currentPage]||'index.html'),'_blank');
}

// ── Products admin (unchanged structure, uses editLang for display)
function renderAdminCategories(){
  adminProductsData=ProductsDB.load();
  const list=document.getElementById('adminCatList');if(!list)return;
  list.innerHTML='';
  adminProductsData.categories.forEach(cat=>{
    const canDel=adminProductsData.categories.length>1;
    const block=document.createElement('div');block.className='admin-cat-block';
    block.innerHTML=`
      <div class="admin-cat-header">
        <h4>📁 ${editLang==='en'&&cat.nameEn?cat.nameEn:cat.name} <small style="color:#aaa;font-weight:normal">(${cat.products.length} ${adminLang==='en'?'products':'个产品'})</small></h4>
        <div class="admin-cat-header-actions">
          <button class="btn-rename-cat" onclick="adminRenameCategory('${cat.id}')">${adminLang==='en'?'✏ Rename':'✏ 重命名'}</button>
          ${canDel?`<button class="btn-del-cat" onclick="adminDeleteCategory('${cat.id}')">${adminLang==='en'?'🗑 Delete':'🗑 删除'}</button>`:''}
        </div>
      </div>
      <div class="admin-cat-body">
        <div class="admin-product-list">
          ${cat.products.map(prod=>`
            <div class="admin-product-item">
              <img class="admin-product-thumb" src="${prod.image}" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&q=60'">
              <div class="admin-product-info">
                <strong>${editLang==='en'&&prod.nameEn?prod.nameEn:prod.name}</strong>
                <span>${((editLang==='en'&&prod.descEn?prod.descEn:prod.desc)||'').slice(0,50)}...</span>
              </div>
              <div class="admin-product-item-actions">
                <button class="btn-edit-p" onclick="adminEditProduct('${cat.id}','${prod.id}')">${adminLang==='en'?'✏ Edit':'✏ 编辑'}</button>
                ${cat.products.length>1?`<button class="btn-del-p" onclick="adminDeleteProduct('${cat.id}','${prod.id}')">🗑</button>`:''}
              </div>
            </div>`).join('')}
        </div>
        <div style="margin-top:12px">
          <button class="btn btn-primary" style="font-size:.85rem;padding:8px 20px" onclick="adminAddProduct('${cat.id}')">${adminLang==='en'?'＋ Add Product':'＋ 添加产品'}</button>
        </div>
      </div>`;
    list.appendChild(block);
  });
}

function adminAddCategory(){
  const name=prompt(adminLang==='en'?'New category name (Chinese):':'新分类名称（中文）：');if(!name?.trim())return;
  const nameEn=prompt(adminLang==='en'?'English name (optional):':'英文名称（可选）：')||name;
  adminProductsData.categories.push({id:'cat_'+Date.now(),name:name.trim(),nameEn:nameEn.trim(),products:[{id:'p_'+Date.now(),name:'新产品',nameEn:'New Product',desc:'产品描述',descEn:'Product description',image:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80'}]});
  ProductsDB.save(adminProductsData);renderAdminCategories();
  syncAllToServer(()=>showAdminToast(adminLang==='en'?'✅ Category added':'✅ 分类已添加','success'),()=>showAdminToast(adminLang==='en'?'Added (sync failed)':'分类已添加（同步失败）'));
}
function adminRenameCategory(catId){
  const cat=adminProductsData.categories.find(c=>c.id===catId);if(!cat)return;
  const name=prompt(adminLang==='en'?'Chinese name:':'中文名称：',cat.name);if(!name?.trim())return;
  const nameEn=prompt(adminLang==='en'?'English name:':'英文名称：',cat.nameEn||'');
  cat.name=name.trim();cat.nameEn=(nameEn||name).trim();
  ProductsDB.save(adminProductsData);renderAdminCategories();
  syncAllToServer(()=>showAdminToast(adminLang==='en'?'✅ Saved':'✅ 已保存','success'),()=>{});
}
function adminDeleteCategory(catId){
  if(adminProductsData.categories.length<=1){alert(adminLang==='en'?'At least one category is required!':'至少保留一个分类！');return;}
  if(!confirm(adminLang==='en'?'Delete this category and all its products?':'确定删除该分类及其所有产品吗？'))return;
  adminProductsData.categories=adminProductsData.categories.filter(c=>c.id!==catId);
  ProductsDB.save(adminProductsData);renderAdminCategories();
  syncAllToServer(()=>showAdminToast(adminLang==='en'?'Category deleted':'分类已删除','success'),()=>{});
}
function adminAddProduct(catId){adminShowProductModal(catId,null);}
function adminEditProduct(catId,prodId){adminShowProductModal(catId,prodId);}
function adminDeleteProduct(catId,prodId){
  const cat=adminProductsData.categories.find(c=>c.id===catId);
  if(!cat||cat.products.length<=1){alert(adminLang==='en'?'Each category needs at least one product!':'每个分类至少保留一个产品！');return;}
  if(!confirm(adminLang==='en'?'Delete this product?':'确定删除该产品吗？'))return;
  cat.products=cat.products.filter(p=>p.id!==prodId);
  ProductsDB.save(adminProductsData);renderAdminCategories();
  syncAllToServer(()=>showAdminToast(adminLang==='en'?'Product deleted':'产品已删除','success'),()=>{});
}
function adminShowProductModal(catId,prodId){
  const cat=adminProductsData.categories.find(c=>c.id===catId);if(!cat)return;
  const prod=prodId?cat.products.find(p=>p.id===prodId):null;
  const overlay=document.createElement('div');overlay.className='admin-modal-overlay';
  overlay.innerHTML=`<div class="admin-modal">
    <h3>${prod?(adminLang==='en'?'Edit Product':'编辑产品'):(adminLang==='en'?'Add Product':'添加新产品')}</h3>
    <div class="admin-grid-2">
      <div class="admin-field"><label>${adminLang==='en'?'Product Name (Chinese) *':'产品名称（中文）*'}</label><input type="text" id="apm-name" value="${prod?prod.name:''}"></div>
      <div class="admin-field"><label>Product Name (EN)</label><input type="text" id="apm-nameEn" value="${prod?prod.nameEn||'':''}"></div>
      <div class="admin-field" style="grid-column:1/-1"><label>${adminLang==='en'?'Description (Chinese)':'介绍（中文）'}</label><textarea id="apm-desc" rows="3">${prod?prod.desc:''}</textarea></div>
      <div class="admin-field" style="grid-column:1/-1"><label>Description (EN)</label><textarea id="apm-descEn" rows="3">${prod?prod.descEn||'':''}</textarea></div>
    </div>
    <div class="admin-field"><label>${adminLang==='en'?'Product Image':'产品图片'}</label>
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
      <button class="btn-cancel" onclick="document.querySelector('.admin-modal-overlay').remove()">${adminLang==='en'?'Cancel':'取消'}</button>
      <button class="btn-confirm" onclick="adminSaveProduct('${catId}','${prodId||''}')">${adminLang==='en'?'Save':'保存'}</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
}
function adminSaveProduct(catId,prodId){
  const cat=adminProductsData.categories.find(c=>c.id===catId);if(!cat)return;
  const name=document.getElementById('apm-name').value.trim();if(!name){alert(adminLang==='en'?'Please enter a product name':'请输入产品名称');return;}
  const obj={name,nameEn:document.getElementById('apm-nameEn').value.trim(),desc:document.getElementById('apm-desc').value.trim(),descEn:document.getElementById('apm-descEn').value.trim(),image:document.getElementById('apm-img').value.trim()||document.getElementById('apm-prev').src};
  if(prodId){const p=cat.products.find(p=>p.id===prodId);if(p)Object.assign(p,obj);}
  else cat.products.push({id:'p_'+Date.now(),...obj});
  ProductsDB.save(adminProductsData);
  document.querySelector('.admin-modal-overlay')?.remove();
  renderAdminCategories();
  syncAllToServer(()=>showAdminToast(adminLang==='en'?'✅ Product saved':'✅ 产品已保存并同步','success'),()=>showAdminToast(adminLang==='en'?'Saved (sync failed)':'产品已保存（同步失败）','error'));
}

// ── Button editor
function renderBtnEditor(){
  const list=document.getElementById('btnEditorList');
  if(!list||typeof BTN_REGISTRY==='undefined')return;
  const pages=window.PAGES||[];
  list.innerHTML=BTN_REGISTRY.map(btn=>{
    const action=getBtnAction(btn.key);
    const pageOptions=pages.map(p=>`<option value="${p.value}" ${action.target===p.value?'selected':''}>${p.label}</option>`).join('');
    return `<div class="btn-editor-row" id="btnrow-${btn.key}" style="border:1.5px solid #e8e8e8;border-radius:10px;padding:20px;margin-bottom:16px;background:#fafafa">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap">
        <div style="flex:1;min-width:200px">
          <div style="font-weight:700;color:#0a1628;margin-bottom:4px;font-size:.95rem">🔘 ${btn.label}</div>
          <div style="font-size:.78rem;color:#aaa;font-family:monospace">data-btn-key="${btn.key}"</div>
        </div>
        <div style="flex:2;min-width:280px">
          <div style="display:flex;gap:0;border:1.5px solid #ddd;border-radius:8px;overflow:hidden;margin-bottom:12px">
            ${[{v:'page',icon:'📄',labelZh:'跳转页面',labelEn:'Page Jump'},{v:'email',icon:'✉',labelZh:'发送邮件',labelEn:'Email'},{v:'external',icon:'🔗',labelZh:'外部链接',labelEn:'External URL'},{v:'none',icon:'🚫',labelZh:'无动作',labelEn:'No Action'}].map(opt=>`
              <label style="flex:1;display:flex;align-items:center;justify-content:center;gap:4px;padding:8px 4px;cursor:pointer;font-size:.8rem;font-weight:600;background:${action.type===opt.v?'#0a1628':'#fff'};color:${action.type===opt.v?'#c9a84c':'#666'};border-right:1px solid #ddd;transition:.2s">
                <input type="radio" name="btntype-${btn.key}" value="${opt.v}" ${action.type===opt.v?'checked':''} onchange="onBtnTypeChange('${btn.key}',this.value)" style="display:none">
                ${opt.icon} ${adminLang==='en'?opt.labelEn:opt.labelZh}</label>`).join('')}
          </div>
          <div id="btnpage-${btn.key}" style="display:${action.type==='page'?'block':'none'}">
            <label style="font-size:.8rem;font-weight:700;color:#555;display:block;margin-bottom:5px">${adminLang==='en'?'Select target page':'选择目标页面'}</label>
            <select id="btntarget-page-${btn.key}" style="width:100%;padding:10px;border:1.5px solid #ddd;border-radius:6px;font-size:.9rem;font-family:inherit;background:#fff">${pageOptions}</select>
          </div>
          <div id="btnemail-${btn.key}" style="display:${action.type==='email'?'block':'none'}">
            <label style="font-size:.8rem;font-weight:700;color:#555;display:block;margin-bottom:5px">${adminLang==='en'?'Recipient email':'收件邮箱地址'}</label>
            <div style="display:flex;align-items:center;gap:8px"><span style="color:#888;font-size:.9rem">mailto:</span>
            <input type="email" id="btntarget-email-${btn.key}" placeholder="info@yourcompany.com" value="${action.type==='email'?action.target:''}" style="flex:1;padding:10px;border:1.5px solid #ddd;border-radius:6px;font-size:.9rem;font-family:inherit;outline:none"></div>
          </div>
          <div id="btnext-${btn.key}" style="display:${action.type==='external'?'block':'none'}">
            <label style="font-size:.8rem;font-weight:700;color:#555;display:block;margin-bottom:5px">${adminLang==='en'?'External URL':'外部链接URL'}</label>
            <input type="url" id="btntarget-ext-${btn.key}" placeholder="https://..." value="${action.type==='external'?action.target:''}" style="width:100%;padding:10px;border:1.5px solid #ddd;border-radius:6px;font-size:.9rem;font-family:inherit;outline:none;box-sizing:border-box">
          </div>
          <div id="btnnone-${btn.key}" style="display:${action.type==='none'?'block':'none'};color:#aaa;font-size:.85rem;padding:8px 0">装饰性按钮，点击无响应</div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function onBtnTypeChange(key,type){
  ['btnpage','btnemail','btnext','btnnone'].forEach(p=>{const el=document.getElementById(p+'-'+key);if(el)el.style.display='none';});
  const map={page:'btnpage',email:'btnemail',external:'btnext',none:'btnnone'};
  const show=document.getElementById(map[type]+'-'+key);if(show)show.style.display='block';
  const row=document.getElementById('btnrow-'+key);if(!row)return;
  row.querySelectorAll('label').forEach(lbl=>{const r=lbl.querySelector('input[type=radio]');if(!r)return;lbl.style.background=r.checked?'#0a1628':'#fff';lbl.style.color=r.checked?'#c9a84c':'#666';});
}
function getSelectedBtnAction(key){
  let type='page';document.querySelectorAll(`input[name="btntype-${key}"]`).forEach(r=>{if(r.checked)type=r.value;});
  let target='';
  if(type==='page'){const s=document.getElementById('btntarget-page-'+key);target=s?s.value:'';}
  if(type==='email'){const s=document.getElementById('btntarget-email-'+key);target=s?s.value.trim():'';}
  if(type==='external'){const s=document.getElementById('btntarget-ext-'+key);target=s?s.value.trim():'';}
  return{type,target};
}
function saveBtnActions(){
  if(typeof BTN_REGISTRY==='undefined')return;
  BTN_REGISTRY.forEach(btn=>{const a=getSelectedBtnAction(btn.key);setBtnAction(btn.key,a.type,a.target);});
  syncAllToServer(()=>showAdminToast(adminLang==='en'?'✅ Button settings saved':'✅ 按钮设置已保存并同步！','success'),()=>showAdminToast(adminLang==='en'?'Saved (sync failed)':'按钮设置已保存（同步失败）','error'));
}

// ── Password change
function changePassword(){
  const cur=document.getElementById('curPwd').value,np=document.getElementById('newPwd').value,cp=document.getElementById('confirmPwd').value;
  const msg=document.getElementById('pwdMsg');
  if(np.length<6){msg.className='admin-msg error';msg.textContent=adminLang==='en'?'Password must be at least 6 characters':'新密码至少6位';msg.style.display='block';return;}
  if(np!==cp){msg.className='admin-msg error';msg.textContent=adminLang==='en'?'Passwords do not match':'两次密码不一致';msg.style.display='block';return;}
  fetch('/api/change-password',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({current:cur,newPassword:np})})
  .then(r=>r.json())
  .then(resp=>{
    if(resp.status==='ok'){
      msg.className='admin-msg success';msg.textContent=adminLang==='en'?'Password changed! Logging out in 2s...':'密码修改成功！2秒后重新登录...';msg.style.display='block';
      ['curPwd','newPwd','confirmPwd'].forEach(id=>document.getElementById(id).value='');
      setTimeout(()=>{localStorage.removeItem(ADMIN_SESSION_KEY);location.reload();},2000);
    }else if(resp.error==='wrong_current_password'){msg.className='admin-msg error';msg.textContent=adminLang==='en'?'Current password is incorrect':'当前密码错误';msg.style.display='block';}
    else if(resp.error==='unauthenticated'){msg.className='admin-msg error';msg.textContent=adminLang==='en'?'Session expired. Please log in again':'登录已过期，请重新登录';msg.style.display='block';}
    else{msg.className='admin-msg error';msg.textContent=(adminLang==='en'?'Failed: ':'修改失败：')+resp.error;msg.style.display='block';}
  })
  .catch(()=>{msg.className='admin-msg error';msg.textContent=adminLang==='en'?'Cannot reach server':'无法连接服务器';msg.style.display='block';});
}

// ── Data management
function exportData(){
  const data={editableContent:{},editableImages:{},btnActions:{},productsData:ProductsDB.load(),themeColors:{primary:localStorage.getItem('theme.primary'),accent:localStorage.getItem('theme.accent')},siteDefaultLang:localStorage.getItem('site.defaultLang')||'auto',exportTime:new Date().toISOString()};
  for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('edit_img_'))data.editableImages[k.replace('edit_img_','')]=localStorage.getItem(k);else if(k.startsWith('edit_'))data.editableContent[k.replace('edit_','')]=localStorage.getItem(k);else if(k.startsWith('btn_action_'))data.btnActions[k.replace('btn_action_','')]=localStorage.getItem(k);}
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='globaltrade-backup-'+Date.now()+'.json';a.click();
  showAdminToast(adminLang==='en'?'✅ Data exported':'✅ 数据已导出','success');
}
function importData(input){
  if(!input.files[0])return;
  const r=new FileReader();
  r.onload=e=>{
    try{
      const data=JSON.parse(e.target.result);
      if(data.editableContent&&!Array.isArray(data.editableContent))Object.entries(data.editableContent).forEach(([k,v])=>localStorage.setItem('edit_'+k,v));
      if(data.editableImages&&!Array.isArray(data.editableImages))Object.entries(data.editableImages).forEach(([k,v])=>localStorage.setItem('edit_img_'+k,v));
      if(data.btnActions&&!Array.isArray(data.btnActions))Object.entries(data.btnActions).forEach(([k,v])=>localStorage.setItem('btn_action_'+k,v));
      if(data.productsData)ProductsDB.save(data.productsData);
      if(data.themeColors){if(data.themeColors.primary)localStorage.setItem('theme.primary',data.themeColors.primary);if(data.themeColors.accent)localStorage.setItem('theme.accent',data.themeColors.accent);}
      if(data.siteDefaultLang)localStorage.setItem('site.defaultLang',data.siteDefaultLang);
      loadAllFields();renderAdminCategories();
      syncAllToServer(()=>showAdminToast(adminLang==='en'?'✅ Imported & synced':'✅ 导入并同步成功！','success'),()=>showAdminToast(adminLang==='en'?'Imported locally (sync failed)':'已导入到本地（同步失败）','error'));
    }catch(err){showAdminToast(adminLang==='en'?'❌ Invalid data format':'❌ 数据格式错误','error');}
  };
  r.readAsText(input.files[0]);
}
function resetData(){
  if(!confirm(t('resetConfirm')))return;
  const keep=['adminLang','adminEditLang','lang'];
  const keys=[];for(let i=0;i<localStorage.length;i++)keys.push(localStorage.key(i));
  keys.filter(k=>!keep.includes(k)&&(k.startsWith('edit_')||k==='productsData'||k.startsWith('theme.')||k.startsWith('btn_action_')||k===ADMIN_SESSION_KEY)).forEach(k=>localStorage.removeItem(k));
  adminProductsData=ProductsDB.reset();loadAllFields();renderAdminCategories();
  syncAllToServer(()=>showAdminToast(adminLang==='en'?'✅ Reset & synced':'✅ 已重置并同步','success'),()=>showAdminToast(adminLang==='en'?'Reset locally (sync failed)':'已重置本地（同步失败）','error'));
}

// ── Toast
function showAdminToast(msg,type='success'){
  const toast=document.getElementById('adminToast');if(!toast)return;
  toast.textContent=msg;toast.className='admin-toast show '+type;
  setTimeout(()=>toast.className='admin-toast',3000);
}

// ── Login
function doLogin(){
  const password=document.getElementById('adminPassword').value;
  const btn=document.getElementById('loginBtn');
  if(btn){btn.disabled=true;btn.textContent=adminLang==='en'?'Verifying...':'验证中...';}
  fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({password})})
  .then(r=>r.json())
  .then(resp=>{
    if(resp.status==='ok'){
      localStorage.setItem(ADMIN_SESSION_KEY,'1');
      document.getElementById('loginOverlay').style.display='none';
      document.getElementById('adminPanel').style.display='flex';
      initAdmin();
    }else if(resp.error==='wrong_password'){
      handleLoginFail(adminLang==='en'?`Wrong password. ${resp.remaining} attempt(s) left.`:`密码错误，还可尝试 ${resp.remaining} 次`);
    }else if(resp.error==='locked'){
      handleLoginFail(adminLang==='en'?`Account locked. Try again in ${Math.floor(resp.retry_after/60)} min.`:`账户已锁定，请 ${Math.floor(resp.retry_after/60)} 分钟后重试`);
      updateLockoutTimer(resp.retry_after);
    }else{handleLoginFail((adminLang==='en'?'Login failed: ':'登录失败：')+(resp.error||'unknown'));}
  })
  .catch(()=>handleLoginFail(adminLang==='en'?'Cannot reach server':'无法连接服务器'))
  .finally(()=>{if(btn){btn.disabled=false;btn.textContent=adminLang==='en'?'Log In':'登 录';}});
}

function handleLoginFail(msg){
  const errEl=document.getElementById('loginError');
  if(errEl){errEl.textContent=msg;errEl.classList.add('show');}
  document.getElementById('adminPassword').value='';
  document.getElementById('adminPassword').focus();
}

function doLogout(){
  fetch('/api/logout',{method:'POST',credentials:'same-origin'}).catch(()=>{});
  localStorage.removeItem(ADMIN_SESSION_KEY);
  document.getElementById('adminPanel').style.display='none';
  document.getElementById('loginOverlay').style.display='flex';
  document.getElementById('adminPassword').value='';
}

// ── INIT
document.addEventListener('DOMContentLoaded',()=>{
  // Apply language before showing any UI (prevents Chinese flash for English users)
  translateLoginPage();
  translateAdminUI();

  // Check if server session is still valid
  fetch('/api/check-auth',{credentials:'same-origin'})
  .then(r=>r.json())
  .then(resp=>{
    if(resp.authenticated){
      localStorage.setItem(ADMIN_SESSION_KEY,'1');
      document.getElementById('loginOverlay').style.display='none';
      document.getElementById('adminPanel').style.display='flex';
      initAdmin();
    }else{
      localStorage.removeItem(ADMIN_SESSION_KEY);
    }
  })
  .catch(()=>{ /* server unreachable — stay on login screen */ });

  document.getElementById('adminPassword')?.addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
});
