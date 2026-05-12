// ===== PRODUCTS PAGE — ALL CATEGORIES SHOWN VERTICALLY =====
let productsData = null;
const isAdmin = localStorage.getItem('adminLoggedIn') === '1';

document.addEventListener('DOMContentLoaded', () => {
  if (isAdmin) document.body.classList.add('admin-mode');
  productsData = ProductsDB.load();
  renderAllCategories();
});

function renderAllCategories() {
  const container = document.getElementById('allCategoriesContent');
  if (!container) return;
  container.innerHTML = '';
  const lang = window.currentLang || 'zh';

  productsData.categories.forEach((cat, catIdx) => {
    const catName = (lang === 'en' && cat.nameEn) ? cat.nameEn : cat.name;
    const section = document.createElement('div');
    section.className = 'product-category-section';
    section.id = 'cat-section-' + cat.id;

    // Category header
    const canDeleteCat = productsData.categories.length > 1;
    section.innerHTML = `
      <div class="product-cat-header">
        <div class="cat-header-left">
          <div class="cat-number">${String(catIdx + 1).padStart(2,'0')}</div>
          <h2 class="cat-title">${catName}</h2>
        </div>
        <div class="cat-header-right admin-only" style="display:none">
          <button class="btn btn-sm btn-cat-rename" onclick="renameCategoryPrompt('${cat.id}')">✏ 重命名</button>
          ${canDeleteCat ? `<button class="btn btn-sm btn-cat-delete" onclick="deleteCategory('${cat.id}')">🗑 删除分类</button>` : ''}
          <button class="btn btn-sm btn-cat-addprod" onclick="addProduct('${cat.id}')">＋ 添加产品</button>
        </div>
      </div>
      <div class="products-grid" id="grid-${cat.id}">
        ${cat.products.map(prod => renderProductCard(cat, prod)).join('')}
      </div>
    `;
    container.appendChild(section);

    // Show admin controls
    if (isAdmin) {
      const adminRight = section.querySelector('.cat-header-right');
      if (adminRight) adminRight.style.display = 'flex';
    }
  });
}

function renderProductCard(cat, prod) {
  const lang = window.currentLang || 'zh';
  const pname = (lang === 'en' && prod.nameEn) ? prod.nameEn : prod.name;
  const pdesc = (lang === 'en' && prod.descEn) ? prod.descEn : prod.desc;
  const canDelete = cat.products.length > 1;
  return `<div class="product-card" id="prod-${prod.id}">
    <div class="product-card-img">
      <img src="${prod.image}" alt="${pname}" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80'">
    </div>
    <div class="product-card-body">
      <h3>${pname}</h3>
      <p>${pdesc}</p>
    </div>
    ${isAdmin ? `<div class="admin-product-actions" style="display:flex">
      <button class="btn-edit-prod" onclick="editProduct('${cat.id}','${prod.id}')">✏ 编辑</button>
      ${canDelete ? `<button class="btn-del-prod" onclick="deleteProduct('${cat.id}','${prod.id}')">🗑 删除</button>` : ''}
    </div>` : ''}
  </div>`;
}

// ===== CATEGORY MANAGEMENT =====
function addCategory() {
  const name = prompt('请输入新分类名称（中文）：');
  if (!name || !name.trim()) return;
  const nameEn = prompt('请输入英文分类名称（可选，直接回车跳过）：') || name;
  const id = 'cat_' + Date.now();
  productsData.categories.push({
    id, name: name.trim(), nameEn: nameEn.trim(),
    products: [{ id: 'p_' + Date.now(), name: '新产品', nameEn: 'New Product', desc: '产品描述请在此填写。', descEn: 'Product description here.', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80' }]
  });
  ProductsDB.save(productsData);
  renderAllCategories();
}

function deleteCategory(catId) {
  if (productsData.categories.length <= 1) { alert('至少保留一个产品分类！'); return; }
  if (!confirm('确定删除该分类及其所有产品吗？此操作不可撤销。')) return;
  productsData.categories = productsData.categories.filter(c => c.id !== catId);
  ProductsDB.save(productsData);
  renderAllCategories();
}

function renameCategoryPrompt(catId) {
  const cat = productsData.categories.find(c => c.id === catId);
  if (!cat) return;
  const name = prompt('修改分类名称（中文）：', cat.name);
  if (!name || !name.trim()) return;
  const nameEn = prompt('修改英文名称：', cat.nameEn || cat.name);
  cat.name = name.trim();
  cat.nameEn = (nameEn || name).trim();
  ProductsDB.save(productsData);
  renderAllCategories();
}

// ===== PRODUCT MANAGEMENT =====
function addProduct(catId) { showProductModal(catId, null); }
function editProduct(catId, prodId) { showProductModal(catId, prodId); }

function deleteProduct(catId, prodId) {
  const cat = productsData.categories.find(c => c.id === catId);
  if (!cat || cat.products.length <= 1) { alert('每个分类至少保留一个产品！'); return; }
  if (!confirm('确定删除该产品吗？')) return;
  cat.products = cat.products.filter(p => p.id !== prodId);
  ProductsDB.save(productsData);
  renderAllCategories();
}

function showProductModal(catId, prodId) {
  const cat = productsData.categories.find(c => c.id === catId);
  if (!cat) return;
  const prod = prodId ? cat.products.find(p => p.id === prodId) : null;
  const overlay = document.createElement('div');
  overlay.className = 'admin-modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;padding:20px';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:32px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,0.3)">
      <h3 style="color:#0a1628;font-family:'Playfair Display',serif;margin-bottom:20px;font-size:1.3rem">${prod ? '编辑产品' : '添加新产品'}</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <div style="display:flex;flex-direction:column;gap:6px"><label style="font-size:.82rem;font-weight:700;color:#555">产品名称（中文）*</label><input type="text" id="pm-name" value="${prod ? prod.name : ''}" style="padding:10px;border:1.5px solid #ddd;border-radius:6px;font-size:.9rem;outline:none"></div>
        <div style="display:flex;flex-direction:column;gap:6px"><label style="font-size:.82rem;font-weight:700;color:#555">Product Name (EN)</label><input type="text" id="pm-nameEn" value="${prod ? (prod.nameEn||'') : ''}" style="padding:10px;border:1.5px solid #ddd;border-radius:6px;font-size:.9rem;outline:none"></div>
        <div style="display:flex;flex-direction:column;gap:6px;grid-column:1/-1"><label style="font-size:.82rem;font-weight:700;color:#555">产品介绍（中文）</label><textarea id="pm-desc" rows="3" style="padding:10px;border:1.5px solid #ddd;border-radius:6px;font-size:.9rem;resize:vertical;font-family:inherit;outline:none">${prod ? prod.desc : ''}</textarea></div>
        <div style="display:flex;flex-direction:column;gap:6px;grid-column:1/-1"><label style="font-size:.82rem;font-weight:700;color:#555">Description (EN)</label><textarea id="pm-descEn" rows="3" style="padding:10px;border:1.5px solid #ddd;border-radius:6px;font-size:.9rem;resize:vertical;font-family:inherit;outline:none">${prod ? (prod.descEn||'') : ''}</textarea></div>
      </div>
      <div style="margin-top:16px">
        <label style="display:block;font-size:.82rem;font-weight:700;color:#555;margin-bottom:8px">产品图片</label>
        <img id="pm-img-prev" src="${prod ? prod.image : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=60'}" style="width:100%;height:160px;object-fit:cover;border-radius:8px;margin-bottom:10px;border:1px solid #eee">
        <input type="url" id="pm-img" placeholder="粘贴图片URL" value="${prod ? prod.image : ''}" style="width:100%;padding:10px;border:1.5px solid #ddd;border-radius:6px;font-size:.9rem;margin-bottom:8px;outline:none;box-sizing:border-box">
        <div style="display:flex;gap:8px">
          <button onclick="document.getElementById('pm-img-prev').src=document.getElementById('pm-img').value" style="flex:1;padding:8px;background:#f0f2f5;border:1px solid #ddd;border-radius:6px;cursor:pointer;font-size:.85rem">应用URL</button>
          <label style="flex:1;padding:8px;background:#f0f2f5;border:1px solid #ddd;border-radius:6px;cursor:pointer;font-size:.85rem;text-align:center">上传图片<input type="file" accept="image/*" style="display:none" onchange="(r=>{r.onload=e=>{document.getElementById('pm-img-prev').src=e.target.result;document.getElementById('pm-img').value=e.target.result};r.readAsDataURL(this.files[0])})(new FileReader())"></label>
        </div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:24px">
        <button onclick="this.closest('[style*=fixed]').remove()" style="padding:10px 24px;background:#f0f2f5;border:1px solid #ddd;border-radius:6px;cursor:pointer;font-family:inherit">取消</button>
        <button onclick="saveProduct('${catId}','${prodId||''}')" style="padding:10px 24px;background:#c9a84c;color:#0a1628;border:none;border-radius:6px;font-weight:700;cursor:pointer;font-family:inherit">保存产品</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function saveProduct(catId, prodId) {
  const cat = productsData.categories.find(c => c.id === catId);
  if (!cat) return;
  const name = document.getElementById('pm-name').value.trim();
  if (!name) { alert('请输入产品名称'); return; }
  const nameEn = document.getElementById('pm-nameEn').value.trim();
  const desc = document.getElementById('pm-desc').value.trim();
  const descEn = document.getElementById('pm-descEn').value.trim();
  const image = document.getElementById('pm-img').value.trim() || document.getElementById('pm-img-prev').src;
  if (prodId) {
    const prod = cat.products.find(p => p.id === prodId);
    if (prod) Object.assign(prod, { name, nameEn, desc, descEn, image });
  } else {
    cat.products.push({ id: 'p_' + Date.now(), name, nameEn, desc, descEn, image });
  }
  ProductsDB.save(productsData);
  document.querySelector('[style*="position:fixed"]')?.remove();
  renderAllCategories();
}

// Re-render on language change
document.addEventListener('langChanged', renderAllCategories);
