# Simple-Business-Websitebuilder

> 🌐 **中文** | [English](README.md)

轻量自托管外贸建站模板，支持中英双语与可视化后台编辑，无需数据库，一条命令完成 Docker 部署。

**在线演示：** [demo.yjggfun.com](https://demo.yjggfun.com)

---

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| 🌐 中英双语 | 管理后台和前台均自动识别访客语言，支持手动切换 |
| ✏️ 可视化编辑 | 登录后直接点击页面文字/图片即可编辑 |
| 🗂 实时侧边栏 | 侧边编辑器，修改立刻呈现在页面上 |
| ⚙️ 管理后台 | 完整内容管理，入口 `/admin.html` |
| 🔘 按钮管理 | 每个按钮独立设置：跳转页面 / 发邮件 / 外部链接 |
| 🎨 主题颜色 | 颜色选择器 + 6 套预设方案 |
| 🔒 安全登录 | bcrypt 密码哈希 + 服务端 Session + 暴力破解锁定 |
| 🐳 Docker 就绪 | 一条命令部署，完美兼容 1Panel / aaPanel 等面板 |
| 📦 无需数据库 | 所有数据存储在单一 `site-data.json` 文件中 |

---

## 📁 项目结构

```
Simple-Business-Websitebuilder/
├── index.html            # 首页
├── products.html         # 产品介绍
├── about.html            # 关于我们
├── contact.html          # 联系我们
├── admin.html            # 管理后台（/admin.html）
├── server.js             # 后端服务器（Express：认证、保存、静态文件）
├── package.json          # Node.js 依赖声明
├── .env.example          # 环境变量模板 → 复制为 .env 后填写
├── css/
│   ├── style.css
│   └── admin.css
├── js/
│   ├── i18n.js           # 双语逻辑 + 自动语言识别
│   ├── main.js           # 核心逻辑、编辑模式、服务器同步
│   ├── admin.js          # 管理后台逻辑
│   ├── btn-actions.js    # 按钮动作管理
│   ├── sidebar-editor.js # 实时侧边栏编辑器
│   ├── products-data.js  # 产品数据存储
│   └── products.js       # 产品页面渲染
├── data/                 # 通过 Docker volume 持久化（运行时自动创建）
│   └── site-data.json    # 所有网站内容
├── Dockerfile
├── docker-compose.yml
├── update.sh             # Docker 一键更新脚本
├── README.md             # 英文文档
└── README_CN.md          # 本文件
```

---

## 🐳 Docker 部署（推荐）

面板工具（1Panel、aaPanel 等）通常已占用 80/443 端口，Docker 可将本项目完全隔离，通过面板的反向代理功能对外提供服务。

### 前置条件

```bash
# 安装 Docker（已安装则跳过）
curl -fsSL https://get.docker.com | sh

# 安装 Docker Compose 插件（已安装则跳过）
apt-get install -y docker-compose-plugin
```

### 第一步：克隆项目并配置环境变量

```bash
git clone https://github.com/your-username/Simple-Business-Websitebuilder.git \
  /opt/1panel/apps/Simple-Business-Websitebuilder
cd /opt/1panel/apps/Simple-Business-Websitebuilder

# 创建环境变量文件
cp .env.example .env
nano .env   # 填写 ADMIN_PASSWORD 和 SESSION_SECRET
```

`.env` 各字段说明：

| 字段 | 用途 | 默认值 |
|------|------|------|
| `ADMIN_PASSWORD` | 初始管理员密码（仅首次启动生效） | `admin123` |
| `SESSION_SECRET` | Session 签名密钥，**必须修改为随机字符串** | 占位符 |
| `PORT` | 宿主机监听端口 | `14514` |

生成安全的 `SESSION_SECRET`：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 第二步：创建数据目录并启动

```bash
mkdir -p data
docker compose up -d --build
```

> 无需执行任何 `chown` 命令 — Node.js 服务以正确权限运行，不存在 PHP/Apache 时代的文件权限问题。

### 第三步：在面板中配置反向代理

**以 1Panel 为例：**
1. 网站 → 创建网站 → 选择「**反向代理**」
2. 主域名填写你的域名
3. 代理地址填写 `http://127.0.0.1:14514`
4. 在网站 HTTPS 设置中申请 Let's Encrypt 证书

aaPanel、宝塔面板等操作类似，均为创建反向代理站点指向 `127.0.0.1:14514`。

### 第四步：验证部署

| 访问地址 | 预期结果 |
|---------|---------|
| `https://你的域名` | 首页正常显示 |
| `https://你的域名/admin.html` | 登录界面以**你浏览器的语言**显示 |
| 输入 `.env` 中设置的密码登录 | 进入管理后台 |
| 修改任意内容并保存 | 提示「✅ 保存并同步成功」，其他设备刷新后同步可见 |

---

## 🔄 更新

使用内置的 `update.sh` 脚本，网站数据完全不受影响：

```bash
cd /opt/1panel/apps/Simple-Business-Websitebuilder
bash update.sh
```

**脚本执行步骤：** `git pull` → 停止旧容器 → 无缓存重新构建镜像 → 启动新容器 → 清理旧镜像。

**更新后无需担心浏览器缓存问题。** 服务器对所有 HTML 响应发送 `Cache-Control: no-cache`，浏览器每次都会加载最新版本，无需手动清缓存。

> ⚠️ **Cloudflare 用户注意：** Cloudflare 可能仍会在边缘节点缓存 `.js` 和 `.css` 文件。如果更新后样式或脚本看起来未变化，登录 CF 控制台 → Caching → **Purge Everything**。
>
> 长期解决方案：在 CF 的 Cache Rules 中将 `*.js` 和 `*.css` 设为 **Bypass cache**，之后更新无需手动清缓存。

---

## ⚙️ 管理后台使用指南

### 语言行为说明

管理后台在首次访问时**自动识别你的浏览器语言**：
- 浏览器为英文 → 后台以**英文**界面打开，前台也默认英文
- 浏览器为中文 → 后台以**中文**界面打开，前台也默认中文

语言偏好存储在浏览器中，下次访问自动保持一致。可随时在后台右上角手动切换。

### 第一步：设置网站默认语言

进入「**网站设置**」，选择访客第一次打开网站时看到的语言：

| 选项 | 效果 |
|------|------|
| 🌍 自动识别（推荐） | 中文浏览器 → 中文；其他 → 英文 |
| 🇨🇳 默认中文 | 所有首次访客看到中文 |
| 🇬🇧 默认英文 | 所有首次访客看到英文 |

访客主动切换过语言后，下次访问会保持他自己的选择，不受此设置影响。

### 第二步：编辑双语内容

左侧栏有两个独立的语言控制器：

```
🌐 界面语言    [中文] [English]   ← 控制后台管理界面的显示语言
✏️ 编辑语言    [中文] [English]   ← 控制右侧正在编辑的是哪个语言的前台内容
```

**推荐操作流程：**
1. 编辑语言切到**中文** → 填写所有中文内容 → 点击「**💾 保存更改**」
2. 编辑语言切到**English** → 填写所有英文内容 → 点击「**💾 保存更改**」
3. 前台访客自动看到对应语言的内容，无混淆

### 第三步：修改管理员密码

左侧菜单 → **修改密码**。首次登录后请立即操作。

修改密码后立即生效，系统会自动退出登录并提示重新登录。

### 数据备份与恢复

- **导出备份：** 网站设置 → 导出所有数据（下载 `.json` 文件）
- **导入恢复：** 网站设置 → 导入数据（从备份文件恢复）
- **重置默认：** 网站设置 → 重置为默认数据（清除所有自定义内容）

---

## 🔒 安全建议

1. **立即修改默认密码**，首次登录后的第一件事
2. **在 `.env` 中设置强 `SESSION_SECRET`**，部署到生产环境前必须修改
3. **务必启用 HTTPS**——通过面板申请 Let's Encrypt 证书
4. 登录受服务器端速率保护：**连续错误 5 次 → 锁定 15 分钟**
5. Session Cookie 设置了 `httpOnly`，JavaScript 无法读取，防止 XSS 窃取

---

## 📦 基本参数

| 项目 | 说明 |
|------|------|
| 版本 | v0.2 |
| 后端 | Node.js 20 + Express，无需数据库 |
| 认证方式 | express-session（httpOnly Cookie，8 小时有效期）|
| 部署方式 | Docker（推荐）|
| 最低服务器配置 | 1 核 CPU / 512 MB 内存 |
| 外部依赖 | Google Fonts CDN（可选，可替换为本地字体）|

---

*[Simple-Business-Websitebuilder](https://github.com/your-username/Simple-Business-Websitebuilder) v0.2*
