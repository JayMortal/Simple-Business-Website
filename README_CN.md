# Simple-Business-Websitebuilder

> 🌐 **中文** | [English](README.md)

轻量自托管外贸建站模板，支持中英双语与可视化后台编辑，无需数据库。

**在线演示：** [demo.yjggfun.com](https://demo.yjggfun.com)

---

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| 🌐 中英双语 | 自动识别访客语言，支持手动切换 |
| ✏️ 可视化编辑 | 登录后直接点击页面文字/图片编辑 |
| 🗂 实时侧边栏 | 侧边编辑器，修改立刻呈现在页面上 |
| ⚙️ 管理后台 | 完整内容管理，入口 `/admin.html` |
| 🔘 按钮管理 | 每个按钮独立设置：跳转页面 / 发邮件 / 外部链接 |
| 🎨 主题颜色 | 颜色选择器 + 6套预设方案 |
| 🔒 安全登录 | bcrypt 密码哈希 + Session 令牌 + 暴力破解锁定 |
| 🐳 Docker 就绪 | 一条命令部署，完美兼容 1Panel / aaPanel 等面板 |
| 📦 无需数据库 | 所有数据存储在单一 `site-data.json` 文件中 |

---

## 📁 项目结构

```
Simple-Business-Websitebuilder/
├── index.html            # 首页
├── products.html         # 产品介绍（所有分类垂直展开）
├── about.html            # 关于我们
├── contact.html          # 联系我们
├── admin.html            # 管理后台（/admin.html）
├── api.php               # 后端接口：持久化存储与身份验证
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
├── Dockerfile
├── docker-compose.yml
├── deploy.sh             # 裸机部署脚本（Nginx + PHP-FPM）
├── update.sh             # Docker 一键更新脚本
├── README.md             # 英文文档
└── README_CN.md          # 本文件
```

---

## 🐳 方式一：Docker 部署（推荐，适用于已安装 1Panel / aaPanel 等面板的 VPS）

面板工具通常已占用 80/443 端口并运行自己的 Nginx，Docker 可将本项目完全隔离，通过面板的反向代理功能对外提供服务。

### 前置条件

```bash
# 安装 Docker（已安装则跳过）
curl -fsSL https://get.docker.com | sh

# 安装 Docker Compose 插件（已安装则跳过）
apt-get install -y docker-compose-plugin
```

### 第一步：克隆项目并初始化数据目录

```bash
# 克隆到面板应用目录
git clone https://github.com/JayMortal/Simple-Business-Websitebuilder.git \
  /opt/1panel/apps/Simple-Business-Websitebuilder
cd /opt/1panel/apps/Simple-Business-Websitebuilder

# 创建数据文件并设置正确权限（www-data UID = 33）
mkdir -p data
echo '{}' > data/site-data.json
echo '{}' > data/api-state.json
chown 33:33 data/site-data.json data/api-state.json
chmod 664   data/site-data.json data/api-state.json
```

> **为什么需要 `chown 33:33`？** 容器内的 Apache 以 `www-data`（UID 33）身份运行。不设置此权限，`api.php` 无法写入数据文件，后台所有保存操作将失败。

### 第二步：启动容器

```bash
docker compose up -d --build
```

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
| `https://你的域名/admin.html` | 出现登录界面 |
| 输入密码 `admin123` 登录 | 进入管理后台 |
| 修改任意内容并保存 | 提示「✅ 保存并同步成功」，其他设备打开网站也能看到修改 |

---

## 🖥 方式二：裸机部署（Nginx + PHP-FPM）

适用于**没有 Docker 和面板工具**的服务器，一条命令完成所有配置。

```bash
git clone https://github.com/JayMortal/Simple-Business-Websitebuilder.git
cd Simple-Business-Websitebuilder
chmod +x deploy.sh

# 仅 HTTP
bash deploy.sh yourdomain.com

# HTTP + 自动 HTTPS（Let's Encrypt）
bash deploy.sh yourdomain.com --ssl
```

脚本自动完成：安装 Nginx + PHP-FPM、复制所有文件、设置 `site-data.json` 和 `api-state.json` 的正确写入权限、配置 Nginx 站点。

---

## 🔄 更新（Docker 部署）

使用项目内置的 `update.sh` 脚本，网站数据完全不受影响：

```bash
cd /opt/1panel/apps/Simple-Business-Websitebuilder
bash update.sh
```

**脚本执行步骤：** `git pull` → 停止旧容器 → 无缓存重新构建镜像 → 启动新容器 → 清理旧镜像。

> ⚠️ **Cloudflare 用户注意：** 更新完成后，登录 CF 控制台 → Caching → **Purge Everything** 清除 CDN 缓存，否则访客可能仍看到旧版页面。
>
> 建议同时在 CF 的 Cache Rules 中将 `*.js` 和 `*.css` 设为 **Bypass cache**，避免下次更新再遇到同样问题。

---

## ⚙️ 管理后台使用指南

### 第一步：设置网站默认语言

进入「**网站设置**」，选择访客第一次打开网站时看到的语言：

| 选项 | 效果 |
|------|------|
| 🌍 自动识别（推荐） | 中文浏览器→中文，其他→英文 |
| 🇨🇳 默认中文 | 所有首次访客看到中文 |
| 🇬🇧 默认英文 | 所有首次访客看到英文 |

访客主动切换过语言后，下次访问会保持他自己的选择，不受此设置影响。

### 第二步：编辑双语内容

左侧栏有两个独立的语言控制器：

```
🌐 界面语言      [中文] [English]   ← 控制后台管理界面的显示语言
✏️ 编辑语言      [中文] [English]   ← 控制右侧正在编辑的是哪个语言的前台内容
```

**推荐操作流程：**
1. 编辑语言切到**中文** → 填写所有中文内容 → 点击「**💾 保存更改**」
2. 编辑语言切到**English** → 填写所有英文内容 → 点击「**💾 保存更改**」
3. 前台访客自动看到对应语言的内容，无混淆

### 第三步：修改管理员密码

左侧菜单 → **修改密码**。首次登录后请立即操作。

### 数据备份与恢复

- **导出备份：** 网站设置 → 导出所有数据（下载 `.json` 文件）
- **导入恢复：** 网站设置 → 导入数据（从备份文件恢复）
- **重置默认：** 网站设置 → 重置为默认数据（清除所有自定义内容）

---

## 🔒 安全建议

1. **立即修改默认密码** `admin123`，首次登录后的第一件事
2. **务必启用 HTTPS**——使用 `--ssl` 参数或通过面板申请证书
3. 如需限制后台访问来源，取消注释 Nginx 配置中的 IP 白名单块
4. 登录受服务器端保护：**连续错误 5 次 → 锁定 15 分钟**

---

## 📦 基本参数

| 项目 | 说明 |
|------|------|
| 版本 | v0.1 |
| 后端 | PHP 8.2，无需数据库 |
| 部署方式 | Docker（推荐）、Nginx + PHP-FPM（裸机） |
| 最低服务器配置 | 1核 CPU / 512 MB 内存 |
| 外部依赖 | Google Fonts CDN（可选，可替换为本地字体） |

---

*[Simple-Business-Websitebuilder](https://github.com/JayMortal/Simple-Business-Websitebuilder) v0.1*
