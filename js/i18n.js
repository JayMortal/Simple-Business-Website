// ===== i18n.js v5 =====
// Changes:
//  - Storage keys split: edit_zh_xxx / edit_en_xxx (bilingual independent storage)
//  - Auto-detect visitor language via navigator.language
//  - Site default language setting: 'auto' | 'zh' | 'en'
//  - All English translations completed — zero language mixing
//  - applyTranslations() always uses i18n dict first, then lang-specific stored value

// ── Full translation dictionary ──────────────────────────────────
const translations = {
  zh: {
    'site.title':            '环球贸易 | GlobalTrade Co.',
    'nav.home':              '首页',
    'nav.products':          '产品介绍',
    'nav.about':             '关于我们',
    'nav.contact':           '联系我们',
    'hero.tag':              '全球领先的贸易伙伴',
    'hero.title':            '连接世界<br>共创未来',
    'hero.desc':             '专注国际贸易20余年，为全球客户提供优质产品与一站式供应链解决方案',
    'hero.btn1':             '探索产品',
    'hero.btn2':             '立即联系',
    'hero.scroll':           '向下探索',
    'stats.years':           '年行业经验',
    'stats.countries':       '覆盖国家地区',
    'stats.clients':         '全球合作客户',
    'stats.products':        '产品品类',
    'features.tag':          '我们的优势',
    'features.title':        '为何选择我们',
    'features.sub':          '多年深耕国际贸易领域，打造值得信赖的全球供应链',
    'feat1.title':           '全球网络',
    'feat1.desc':            '覆盖80+国家的完善贸易网络，本地化服务团队随时响应您的需求',
    'feat2.title':           '品质保障',
    'feat2.desc':            '严苛的质量管控体系，通过ISO9001认证，每一件产品都经过严格检测',
    'feat3.title':           '高效交付',
    'feat3.desc':            '完善的物流体系与仓储网络，确保订单准时交付，响应迅速',
    'feat4.title':           '专业服务',
    'feat4.desc':            '经验丰富的贸易专家团队，提供从询价到售后的全流程专业支持',
    'featured.tag':          '精选产品',
    'featured.title':        '热门产品推荐',
    'featured.more':         '查看全部产品',
    'fp1.cat':               '电子产品',
    'fp1.name':              '智能控制模块',
    'fp1.desc':              '高性能工业级智能控制模块，适用于各类自动化场景',
    'fp2.cat':               '机械配件',
    'fp2.name':              '精密轴承组件',
    'fp2.desc':              '采用优质钢材，精密加工，耐磨耐用，适用于高负载环境',
    'fp3.cat':               '包装材料',
    'fp3.name':              '环保包装解决方案',
    'fp3.desc':              '可降解材料，符合国际环保标准，助力绿色贸易',
    'cta.title':             '准备好开始合作了吗？',
    'cta.desc':              '立即联系我们的专业团队，获取定制化贸易解决方案',
    'cta.btn':               '免费咨询',
    'footer.tagline':        '连接全球，共创价值',
    'footer.nav':            '快速导航',
    'footer.contact':        '联系方式',
    'footer.address':        '📍 上海市浦东新区贸易大厦18楼',
    'footer.copy':           '© 2024 GlobalTrade Co. All Rights Reserved.',
    'products.pageTitle':    '产品介绍 | GlobalTrade Co.',
    'products.heroTitle':    '我们的产品',
    'products.heroSub':      '专业产品线，满足全球市场需求',
    'admin.addCat':          '添加分类',
    'admin.addProd':         '添加产品',
    'about.pageTitle':       '关于我们 | GlobalTrade Co.',
    'about.heroTitle':       '关于我们',
    'about.heroSub':         '二十年匠心，铸就全球贸易新标杆',
    'about.storyTag':        '我们的故事',
    'about.storyTitle':      '从一粒种子到参天大树',
    'about.storyP1':         'GlobalTrade Co. 成立于2004年，总部位于上海。二十年来，我们始终坚守"诚信、专业、创新"的核心价值观，从一家小型贸易公司成长为覆盖全球80余个国家和地区的综合性贸易集团。',
    'about.storyP2':         '我们拥有超过500名专业贸易团队成员，在亚洲、欧洲、北美及中东设有区域办公室，为全球5000余家合作伙伴提供稳定、高效的供应链解决方案。',
    'about.storyP3':         '面向未来，我们将持续深化数字化贸易能力，以技术赋能贸易，为全球客户创造更大价值。',
    'about.yearsLabel':      '年专业经验',
    'about.missionTag':      '使命与价值观',
    'about.missionTitle':    '驱动我们前行的力量',
    'about.vision':          '愿景',
    'about.visionText':      '成为最受信赖的全球贸易伙伴，让世界贸易更简单、更高效',
    'about.mission':         '使命',
    'about.missionText':     '通过专业服务和创新解决方案，连接全球供需，创造共同价值',
    'about.values':          '价值观',
    'about.valuesText':      '诚信为本 · 专业精进 · 创新驱动 · 共赢发展',
    'about.teamTag':         '核心团队',
    'about.teamTitle':       '专业团队，卓越服务',
    'team1.name':            '张明远',
    'team1.role':            '创始人 & CEO',
    'team1.bio':             '20年国际贸易经验，前500强企业高管，主导公司全球战略布局',
    'team2.name':            '李雪婷',
    'team2.role':            '首席运营官 COO',
    'team2.bio':             '供应链管理专家，主导公司运营体系优化，推动数字化转型',
    'team3.name':            '王志远',
    'team3.role':            '技术总监 CTO',
    'team3.bio':             '资深技术专家，带领技术团队打造智慧贸易平台，赋能业务增长',
    'about.certTag':         '荣誉资质',
    'about.certTitle':       '专业认证，值得信赖',
    'cert1':                 'ISO 9001:2015 质量管理体系认证',
    'cert2':                 'ISO 14001 环境管理体系认证',
    'cert3':                 '海关AEO高级认证企业',
    'cert4':                 '中国对外贸易质量奖',
    'contact.pageTitle':     '联系我们 | GlobalTrade Co.',
    'contact.heroTitle':     '联系我们',
    'contact.heroSub':       '我们期待与您的每一次合作',
    'contact.infoTitle':     '与我们取得联系',
    'contact.infoDesc':      '无论您是寻找优质产品、了解合作方式，还是需要定制化解决方案，我们的专业团队随时准备为您服务。',
    'contact.address':       '公司地址',
    'contact.addressVal':    '上海市浦东新区张江高科技园区贸易大厦18楼',
    'contact.phone':         '联系电话',
    'contact.email':         '电子邮件',
    'contact.hours':         '工作时间',
    'contact.hoursVal':      '周一至周五 9:00 - 18:00 (UTC+8)',
    'contact.formTitle':     '发送询盘',
    'contact.name':          '姓名 *',
    'contact.namePlh':       '您的姓名',
    'contact.company':       '公司名称',
    'contact.companyPlh':    '您的公司',
    'contact.emailLabel':    '电子邮件 *',
    'contact.phoneLabel':    '电话号码',
    'contact.subject':       '询盘主题 *',
    'contact.subjectPlh':    '请输入主题',
    'contact.message':       '询盘内容 *',
    'contact.messagePlh':    '请描述您的需求...',
    'contact.submitBtn':     '发送询盘',
    'contact.formNote':      '* 我们通常在1个工作日内回复',
  },
  en: {
    'site.title':            'GlobalTrade Co. | International Trade',
    'nav.home':              'Home',
    'nav.products':          'Products',
    'nav.about':             'About Us',
    'nav.contact':           'Contact',
    'hero.tag':              'Your Global Trade Partner',
    'hero.title':            'Connecting the World,<br>Building the Future',
    'hero.desc':             'Over 20 years in international trade, delivering premium products and end-to-end supply chain solutions worldwide.',
    'hero.btn1':             'Explore Products',
    'hero.btn2':             'Contact Us',
    'hero.scroll':           'Scroll Down',
    'stats.years':           'Years of Experience',
    'stats.countries':       'Countries & Regions',
    'stats.clients':         'Global Partners',
    'stats.products':        'Product Categories',
    'features.tag':          'Why Choose Us',
    'features.title':        'Our Advantages',
    'features.sub':          'Decades of expertise in global trade, building a trusted worldwide supply chain.',
    'feat1.title':           'Global Network',
    'feat1.desc':            'A comprehensive trade network spanning 80+ countries with local teams ready to serve you.',
    'feat2.title':           'Quality Assurance',
    'feat2.desc':            'Rigorous quality controls with ISO 9001 certification. Every product undergoes strict inspection.',
    'feat3.title':           'Efficient Delivery',
    'feat3.desc':            'A robust logistics and warehousing network ensures timely delivery and rapid response.',
    'feat4.title':           'Professional Service',
    'feat4.desc':            'Experienced trade experts providing end-to-end support from inquiry to after-sales.',
    'featured.tag':          'Featured Products',
    'featured.title':        'Top Product Picks',
    'featured.more':         'View All Products',
    'fp1.cat':               'Electronics',
    'fp1.name':              'Smart Control Module',
    'fp1.desc':              'High-performance industrial smart control module for various automation applications.',
    'fp2.cat':               'Mechanical Parts',
    'fp2.name':              'Precision Bearing Assembly',
    'fp2.desc':              'Premium steel, precision machined, durable and wear-resistant for high-load environments.',
    'fp3.cat':               'Packaging',
    'fp3.name':              'Eco Packaging Solutions',
    'fp3.desc':              'Biodegradable materials meeting international environmental standards for green trade.',
    'cta.title':             'Ready to Partner With Us?',
    'cta.desc':              'Contact our expert team for a customized trade solution.',
    'cta.btn':               'Free Consultation',
    'footer.tagline':        'Connecting the Globe, Creating Value',
    'footer.nav':            'Quick Links',
    'footer.contact':        'Contact Info',
    'footer.address':        '📍 18F Trade Tower, Pudong New Area, Shanghai',
    'footer.copy':           '© 2024 GlobalTrade Co. All Rights Reserved.',
    'products.pageTitle':    'Products | GlobalTrade Co.',
    'products.heroTitle':    'Our Products',
    'products.heroSub':      'Professional product lines for global market needs.',
    'admin.addCat':          'Add Category',
    'admin.addProd':         'Add Product',
    'about.pageTitle':       'About Us | GlobalTrade Co.',
    'about.heroTitle':       'About Us',
    'about.heroSub':         'Twenty Years of Excellence in Global Trade',
    'about.storyTag':        'Our Story',
    'about.storyTitle':      'From a Seed to a Towering Tree',
    'about.storyP1':         'GlobalTrade Co. was founded in 2004 and is headquartered in Shanghai. Over twenty years, we have upheld the core values of integrity, professionalism, and innovation, growing from a small trading company into a comprehensive trade group covering over 80 countries and regions worldwide.',
    'about.storyP2':         'We have more than 500 professional trade team members and regional offices in Asia, Europe, North America, and the Middle East, providing stable and efficient supply chain solutions for over 5,000 partners globally.',
    'about.storyP3':         'Looking ahead, we will continue to deepen our digital trade capabilities, empowering trade with technology to create greater value for global customers.',
    'about.yearsLabel':      'Years of Expertise',
    'about.missionTag':      'Mission & Values',
    'about.missionTitle':    'The Force Driving Us Forward',
    'about.vision':          'Vision',
    'about.visionText':      'To be the most trusted global trade partner, making world trade simpler and more efficient.',
    'about.mission':         'Mission',
    'about.missionText':     'To connect global supply and demand through professional services and innovative solutions, creating shared value.',
    'about.values':          'Values',
    'about.valuesText':      'Integrity · Professionalism · Innovation · Mutual Success',
    'about.teamTag':         'Core Team',
    'about.teamTitle':       'Professional Team, Outstanding Service',
    'team1.name':            'Michael Zhang',
    'team1.role':            'Founder & CEO',
    'team1.bio':             '20 years of international trade experience, former Fortune 500 executive leading global strategy.',
    'team2.name':            'Lisa Li',
    'team2.role':            'Chief Operating Officer',
    'team2.bio':             'Supply chain management expert leading operational optimization and digital transformation.',
    'team3.name':            'Victor Wang',
    'team3.role':            'Chief Technology Officer',
    'team3.bio':             'Senior technology expert leading the development of intelligent trade platforms to drive growth.',
    'about.certTag':         'Certifications',
    'about.certTitle':       'Certified & Trusted',
    'cert1':                 'ISO 9001:2015 Quality Management System',
    'cert2':                 'ISO 14001 Environmental Management System',
    'cert3':                 'Customs AEO Advanced Certified Enterprise',
    'cert4':                 'China Foreign Trade Quality Award',
    'contact.pageTitle':     'Contact Us | GlobalTrade Co.',
    'contact.heroTitle':     'Contact Us',
    'contact.heroSub':       'We look forward to every collaboration with you.',
    'contact.infoTitle':     'Get In Touch',
    'contact.infoDesc':      'Whether you are looking for quality products, partnership opportunities, or customized solutions, our professional team is always ready to serve you.',
    'contact.address':       'Address',
    'contact.addressVal':    '18F Trade Tower, Zhangjiang Hi-Tech Park, Pudong, Shanghai',
    'contact.phone':         'Phone',
    'contact.email':         'Email',
    'contact.hours':         'Business Hours',
    'contact.hoursVal':      'Mon–Fri 9:00 AM – 6:00 PM (UTC+8)',
    'contact.formTitle':     'Send an Inquiry',
    'contact.name':          'Name *',
    'contact.namePlh':       'Your Name',
    'contact.company':       'Company',
    'contact.companyPlh':    'Your Company',
    'contact.emailLabel':    'Email *',
    'contact.phoneLabel':    'Phone',
    'contact.subject':       'Subject *',
    'contact.subjectPlh':    'Enter subject',
    'contact.message':       'Message *',
    'contact.messagePlh':    'Describe your requirements...',
    'contact.submitBtn':     'Send Inquiry',
    'contact.formNote':      '* We usually reply within 1 business day.',
  }
};

// ── Language resolution ──────────────────────────────────────────
// Priority: visitor's stored choice > site default setting > auto-detect
function resolveInitialLang() {
  // 1. Visitor has made a choice before — always respect it
  const stored = localStorage.getItem('lang');
  if (stored === 'zh' || stored === 'en') return stored;

  // 2. Site default language set by admin
  const siteLang = localStorage.getItem('site.defaultLang') || 'auto';
  if (siteLang === 'zh') return 'zh';
  if (siteLang === 'en') return 'en';

  // 3. Auto-detect via browser language
  const browserLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
  return browserLang.startsWith('zh') ? 'zh' : 'en';
}

window.currentLang = resolveInitialLang();

// ── Storage key helpers ──────────────────────────────────────────
// Content is stored per-language: edit_zh_xxx / edit_en_xxx
// Legacy keys (edit_xxx without lang prefix) are treated as zh for migration
window.editKey    = (lang, key) => `edit_${lang}_${key}`;
window.editImgKey = (lang, key) => `edit_img_${lang}_${key}`;

// Get stored value for a key in a given language, fallback to legacy key (zh migration)
window.getStoredContent = function(lang, key) {
  const langVal = localStorage.getItem(editKey(lang, key));
  if (langVal !== null) return langVal;
  // Legacy migration: old edit_xxx keys treated as zh
  if (lang === 'zh') {
    const legacy = localStorage.getItem('edit_' + key);
    if (legacy !== null) return legacy;
  }
  return null;
};

window.getStoredImage = function(lang, key) {
  const langVal = localStorage.getItem(editImgKey(lang, key));
  if (langVal !== null) return langVal;
  if (lang === 'zh') {
    const legacy = localStorage.getItem('edit_img_' + key);
    if (legacy !== null) return legacy;
  }
  return null;
};

// ── Apply translations to the page ──────────────────────────────
function applyTranslations(lang) {
  window.currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.body.classList.remove('lang-zh', 'lang-en');
  document.body.classList.add('lang-' + lang);

  const t = translations[lang] || translations.zh;

  // Apply data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (!t[key]) return;

    // Check for lang-specific stored content
    const editKey2 = el.getAttribute('data-editable');
    const stored = editKey2 ? window.getStoredContent(lang, editKey2) : null;

    const value = stored !== null ? stored : t[key];
    if (value.includes('<br>')) el.innerHTML = value;
    else el.textContent = value;
  });

  // Apply data-i18n-placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const k = el.getAttribute('data-i18n-placeholder');
    if (t[k]) el.placeholder = t[k];
  });

  // Apply data-editable elements that have no data-i18n (editable-only fields)
  document.querySelectorAll('[data-editable]:not([data-i18n])').forEach(el => {
    const key = el.getAttribute('data-editable');
    const stored = window.getStoredContent(lang, key);
    if (stored !== null) el.textContent = stored;
  });

  // Apply images per language
  document.querySelectorAll('[data-editable-img]').forEach(el => {
    const key = el.getAttribute('data-editable-img');
    const stored = window.getStoredImage(lang, key);
    if (stored) el.src = stored;
  });

  // Update page title
  if (t['site.title'] && !document.querySelector('[data-i18n="site.title"]')) {
    document.title = t['site.title'];
  }

  // Dispatch event for other modules to react
  document.dispatchEvent(new CustomEvent('langChanged', { detail: { lang } }));
}

function toggleLang() {
  const newLang = window.currentLang === 'zh' ? 'en' : 'zh';
  applyTranslations(newLang);
}

// Expose translations for admin use
window.i18nTranslations = translations;
window.applyTranslations = applyTranslations;
window.toggleLang = toggleLang;

// ── Init ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  applyTranslations(window.currentLang);
});
