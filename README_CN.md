# Simple Business Website — 轻量外贸网站模板

> 🌐 **中文** | [English](README.md)

一个功能完整的外贸企业网站模板，支持中英双语、可视化后台管理、实时侧边栏编辑器、一键部署到 Linux VPS，无需任何后端服务。

---

## 📁 项目结构

```
trade-website/
├── index.html            # 首页
├── products.html         # 产品介绍页（所有分类垂直展开）
├── about.html            # 关于我们
├── contact.html          # 联系我们
├── admin.html            # 管理后台（通过 /admin.html 访问）
├── css/
│   ├── style.css         # 主样式表 + CSS 主题变量
│   └── admin.css         # 管理后台样式
├── js/
│   ├── i18n.js           # 中英文切换
│   ├── main.js           # 核心逻辑、编辑模式、Logo/Favicon、主题色
│   ├── btn-actions.js    # 按钮动作管理（跳转页面 / 发邮件 / 外部链接）
│   ├── sidebar-editor.js # 实时侧边栏编辑器
│   ├── products-data.js  # 产品数据存储（localStorage）
│   ├── products.js       # 产品页渲染与管理
│   └── admin.js          # 管理后台逻辑
├── deploy.sh             # 一键部署脚本
├── README.md             # 英文文档
└── README_CN.md          # 本文件（中文）
```

---

## 🚀 一键部署到 VPS

### 前置条件

- Ubuntu 20.04 / 22.04 LTS（或兼容的 Debian 系发行版）
- 服务器 `root` 权限
- 域名已解析到服务器 IP 地址

### 第一步 — 将代码上传到服务器

**方式一：从 GitHub 克隆（推荐）**
```bash
git clone https://github.com/你的用户名/trade-website.git /root/trade-website
cd /root/trade-website
```

**方式二：通过 SCP 从本地上传**
```bash
# 在本地机器上执行
scp -r ./trade-website root@你的服务器IP:/root/
```

### 第二步 — 运行部署脚本

```bash
cd /root/trade-website
chmod +x deploy.sh

# 仅 HTTP
bash deploy.sh yourdomain.com

# HTTP + 自动 HTTPS（Let's Encrypt）
bash deploy.sh yourdomain.com --ssl
```

脚本将自动完成：
- 安装 Nginx（如未安装）
- 将网站文件复制到 `/var/www/globaltrade/`
- 生成并启用优化过的 Nginx 配置
- 开放防火墙 80 和 443 端口
- 可选：申请并配置 SSL 证书

### 第三步 — 完成！

| 地址 | 用途 |
|------|------|
| `http://yourdomain.com` | 公开网站 |
| `http://yourdomain.com/admin.html` | 管理后台 |
| 默认密码 | `admin123` — **首次登录后请立即修改** |

---

## ✨ 功能特性

### 网站页面

| 页面 | 内容 |
|------|------|
| 首页 | Hero 横幅、统计数据栏、优势特色、精选产品、CTA 横幅 |
| 产品介绍 | 所有分类垂直展开，每个分类下完整产品网格 |
| 关于我们 | 公司故事、使命与价值观、团队介绍、荣誉资质 |
| 联系我们 | 联系信息卡、询盘表单、社交媒体按钮 |

### 🌐 中英双语

- 页眉右上角一键切换中文 / 英文
- 语言偏好自动通过 `localStorage` 保存
- 管理后台所有字段均支持中英文独立录入
- 产品名称、介绍、分类名称均有独立的中文 / 英文字段

### ✏️ 内联编辑模式

登录管理后台后，前台所有页面进入**编辑模式**：
- 所有文字元素可直接点击编辑，内容自动实时保存
- 所有图片显示点击替换遮罩层——粘贴 URL 或上传本地图片
- 底部浮动工具栏提供：**保存**、**侧边栏编辑**、**管理后台**、**退出**

### 🗂 实时侧边栏编辑器

点击浮动工具栏中的**「侧边栏编辑」**，左侧滑出编辑面板：
- 当前页面所有可编辑字段自动列出并按区域分组
- 文字修改实时反映在背后的页面上
- 图片字段支持 URL 输入、本地上传及即时缩略图预览
- 面板内可切换语言
- **保存**与**取消**均有二次确认弹窗，防止误操作

### ⚙️ 管理后台（`/admin.html`）

| 模块 | 可管理内容 |
|------|-----------|
| 首页 | Hero 文字与背景图、统计数字、优势区域、精选产品、CTA |
| 产品介绍 | 增删改分类（最少1个）；增删改产品（每类最少1个）；中英双语内容；图片 URL 或上传 |
| 关于我们 | 故事文字与配图、使命/愿景/价值观、团队成员介绍、荣誉资质 |
| 联系我们 | 联系方式、工作时间、社交媒体按钮文字 |
| **按钮管理** | 为每个按钮单独设置动作：跳转页面（下拉选择）、发送邮件（填邮箱地址）、外部链接、无动作 |
| 网站设置 | Logo 文字、Logo 图片（设置后替代文字）、浏览器标签 Favicon（独立设置）、页脚内容 |
| 主题颜色 | 主色 + 强调色选择器，支持十六进制输入，实时渐变预览，6套一键预设方案 |
| 修改密码 | 需输入当前密码；新密码最少6位 |
| 数据管理 | 导出全部数据为 JSON 备份；从 JSON 导入；重置为默认数据 |

### 🔘 按钮动作管理

每个可配置按钮均可独立设置为以下四种动作之一：

| 动作类型 | 效果 |
|----------|------|
| 📄 跳转页面 | 从现有页面下拉选择，无需手动填写链接 |
| ✉️ 发送邮件 | 只需填写邮箱地址，自动生成 `mailto:` 链接 |
| 🔗 外部链接 | 填写完整 URL，在新标签页打开 |
| 🚫 无动作 | 装饰性按钮，点击无任何响应 |

可管理的按钮：Hero 按钮1和2、「查看全部产品」、CTA 按钮、微信 / LinkedIn / WhatsApp 社交按钮、询盘表单提交按钮。

### 🔒 防暴力破解

- 连续输错密码 **5次** 将锁定账户 **15分钟**
- 锁定期间显示实时倒计时
- 锁定期间登录按钮自动禁用
- 锁定时间结束后自动恢复，尝试次数重置

### 🎨 主题颜色编辑器

- 主色和强调色各自提供颜色选择器 + 十六进制输入框
- 实时渐变预览，选色时即时更新
- 六套内置预设方案：深海金（默认）、深夜红、森林橙、商务蓝、科技紫、黑金绿
- 颜色通过 CSS 自定义属性应用，刷新前台页面后全站生效

### 🖼 Logo 与 Favicon

- **Logo 图片**：上传图片后自动替换所有页面的文字 Logo
- **浏览器标签 Favicon**：独立设置，可使用与 Logo 不同的图片
- 清除 Logo 图片后自动恢复文字 Logo

---

## 🔧 自定义配置

### 修改管理员密码

管理后台 → 左侧菜单「修改密码」

### 通过代码修改主题颜色

编辑 `css/style.css` 顶部的 CSS 变量：

```css
:root {
  --navy: #0a1628;   /* 主色（深色背景，如导航栏、页脚） */
  --gold: #c9a84c;   /* 强调色（按钮、高亮、装饰） */
}
```

也可直接在管理后台「主题颜色」页面操作，无需修改代码。

### 数据持久化说明

所有内容存储在浏览器的 `localStorage`（纯前端，无需服务器或数据库）：

- 使用管理后台「**导出数据**」下载 JSON 备份文件
- 更换设备或清理浏览器数据后，使用「**导入数据**」恢复
- 如需服务器端持久化，可集成轻量的 Node.js 或 PHP 端点，将导出的 JSON 写入服务器文件

---

## 📌 Nginx 配置说明

部署脚本自动生成 `/etc/nginx/sites-available/globaltrade`，包含：

- **Gzip 压缩**：适用于 CSS、JS、HTML、SVG、JSON
- **静态资源缓存**：30天浏览器缓存（`Cache-Control: public, immutable`）
- **安全响应头**：`X-Frame-Options`、`X-Content-Type-Options`、`X-XSS-Protection`、`Referrer-Policy`
- **注释掉的 IP 白名单**：针对 `/admin.html`，取消注释即可按 IP 限制后台访问
- 访问日志和错误日志：`/var/log/nginx/globaltrade_access.log` 和 `globaltrade_error.log`

---

## 🔒 安全建议

1. **立即修改默认密码** `admin123`，首次登录后第一件事
2. 在 Nginx 配置中取消注释 IP 白名单，限制 `/admin.html` 的访问来源
3. 始终启用 HTTPS——在运行 `deploy.sh` 时加上 `--ssl` 参数
4. 定期通过管理后台导出 JSON 数据备份并妥善保存

---

## 🔄 代码更新后重新部署

```bash
# 本地：提交并推送
git add .
git commit -m "update: 描述本次修改内容"
git push

# 服务器：拉取并同步
ssh root@你的服务器IP
cd /root/trade-website
git pull
cp -r *.html css js /var/www/globaltrade/
systemctl reload nginx
```

> **技巧：** 如果不想每次都手动执行 `cp`，可在运行 `deploy.sh` 之前将脚本中的 `SITE_DIR` 改为 `/root/trade-website`。这样 Nginx 直接从 Git 仓库目录提供文件，`git pull` 之后无需额外步骤，线上即时更新。

---

## 📦 基本参数

| 项目 | 说明 |
|------|------|
| 文件总数 | 15个（7个 HTML/CSS，7个 JS，1个 Shell 脚本） |
| ZIP 压缩包大小 | 约 68 KB |
| 外部依赖 | Google Fonts（CDN，可替换为本地字体） |
| 是否需要后端 | 不需要——100% 静态文件 |
| 最低服务器配置 | 1核 CPU / 512 MB 内存（任意入门级 VPS 均可） |

---

*Built with ❤️ — Simple Business Website*
