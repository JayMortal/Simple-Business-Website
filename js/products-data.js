// ===== PRODUCTS DATA STORE =====
const DEFAULT_PRODUCTS_DATA = {
  categories: [
    {
      id: 'cat1',
      name: '电子产品',
      nameEn: 'Electronics',
      products: [
        {
          id: 'p1',
          name: '智能控制模块 X200',
          nameEn: 'Smart Control Module X200',
          desc: '高性能工业级智能控制模块，支持多协议通信，适用于各类工业自动化场景，稳定可靠。',
          descEn: 'High-performance industrial smart control module with multi-protocol communication for various automation scenarios.',
          image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80'
        },
        {
          id: 'p2',
          name: '工业传感器套件',
          nameEn: 'Industrial Sensor Kit',
          desc: '全系列工业传感器，精度高、响应快，适配各主流PLC品牌，即插即用。',
          descEn: 'Full-range industrial sensors with high precision and fast response, compatible with major PLC brands.',
          image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80'
        },
        {
          id: 'p3',
          name: '数字显示仪表',
          nameEn: 'Digital Display Meter',
          desc: '高清LED数字显示，支持多种输入信号，防水防尘，适合恶劣工业环境使用。',
          descEn: 'HD LED digital display supporting multiple input signals, waterproof and dustproof for harsh environments.',
          image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&q=80'
        }
      ]
    },
    {
      id: 'cat2',
      name: '机械配件',
      nameEn: 'Mechanical Parts',
      products: [
        {
          id: 'p4',
          name: '精密轴承组件',
          nameEn: 'Precision Bearing Assembly',
          desc: '采用优质轴承钢，精密热处理，低噪音高寿命，适用于各类旋转机械设备。',
          descEn: 'Premium bearing steel with precision heat treatment, low noise and long service life for rotary machinery.',
          image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'
        },
        {
          id: 'p5',
          name: '液压密封组合',
          nameEn: 'Hydraulic Seal Assembly',
          desc: '进口材料制造，耐高压、耐高温，广泛应用于液压系统密封场合，规格齐全。',
          descEn: 'Imported materials, high pressure and high temperature resistant, widely used in hydraulic system sealing.',
          image: 'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=600&q=80'
        },
        {
          id: 'p6',
          name: '链条传动系统',
          nameEn: 'Chain Drive System',
          desc: '标准及非标准链条定制，高强度，耐磨损，配套齿轮箱及张紧装置，系统配套供应。',
          descEn: 'Standard and custom chains, high strength and wear resistant, with gearboxes and tensioners as system.',
          image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80'
        }
      ]
    },
    {
      id: 'cat3',
      name: '包装材料',
      nameEn: 'Packaging Materials',
      products: [
        {
          id: 'p7',
          name: '环保纸箱系列',
          nameEn: 'Eco Carton Series',
          desc: '采用可再生纸浆，符合国际环保标准，可定制印刷，强度高，适合跨境运输。',
          descEn: 'Renewable pulp, meets international environmental standards, customizable printing, ideal for cross-border shipping.',
          image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80'
        },
        {
          id: 'p8',
          name: '气柱缓冲包装',
          nameEn: 'Air Column Cushioning',
          desc: '充气式缓冲包装，轻量化，保护性强，可折叠储存，节省仓储空间，环保可回收。',
          descEn: 'Inflatable cushioning packaging, lightweight and protective, foldable for storage, recyclable.',
          image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80'
        }
      ]
    },
    {
      id: 'cat4',
      name: '化工原料',
      nameEn: 'Chemical Materials',
      products: [
        {
          id: 'p9',
          name: '工业溶剂系列',
          nameEn: 'Industrial Solvent Series',
          desc: '高纯度工业溶剂，产品线完整，符合国际质量标准，提供专业的化学品贸易服务。',
          descEn: 'High-purity industrial solvents, complete product line, meeting international quality standards.',
          image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&q=80'
        },
        {
          id: 'p10',
          name: '特种涂料材料',
          nameEn: 'Specialty Coating Materials',
          desc: '防腐、防锈、防水等特种涂料原材料，性能卓越，广泛用于工业防护领域。',
          descEn: 'Anti-corrosion, anti-rust, waterproof specialty coating raw materials for industrial protection.',
          image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&q=80'
        }
      ]
    }
  ]
};

// Load/save products data
function loadProductsData() {
  const stored = localStorage.getItem('productsData');
  if (stored) {
    try { return JSON.parse(stored); } catch(e) {}
  }
  return JSON.parse(JSON.stringify(DEFAULT_PRODUCTS_DATA));
}

function saveProductsData(data) {
  localStorage.setItem('productsData', JSON.stringify(data));
}

function resetProductsData() {
  localStorage.removeItem('productsData');
  return JSON.parse(JSON.stringify(DEFAULT_PRODUCTS_DATA));
}

window.ProductsDB = { load: loadProductsData, save: saveProductsData, reset: resetProductsData, defaults: DEFAULT_PRODUCTS_DATA };
