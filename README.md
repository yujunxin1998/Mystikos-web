# Mystikos 前端工程

Mystikos 是一个面向海外玩家的陪玩、公会与周边商城产品前端。项目基于 Nuxt 4、Vue 3 和 TypeScript 构建，默认使用中文界面，同时提供英文切换、明暗主题及响应式适配。

## 技术栈

- Nuxt 4 + Vue 3 + TypeScript
- Nuxt 服务端路由：用于代理认证接口，避免浏览器跨域问题
- 原生 Composition API 状态管理
- CSS 自定义属性：明暗主题与响应式布局
- 字体：Playfair Display / DM Sans / DM Mono（西文）+ Noto Serif SC / Noto Sans SC（简体中文回退），均经 `@fontsource` 本地打包，OFL 可商用

## 已实现功能

### 首页与商城

- 品牌首页、陪玩推荐、排行榜、会员成长与亲密度展示
- 奇物商城：分类筛选、商品详情弹层、本地心愿单
- 默认中文，支持中英文切换
- 明亮 / 暗黑主题切换
- 桌面端与移动端自适应，支持减少动态效果偏好

### 认证

- 账号密码登录：后端定义的邮箱或手机号格式
- 邮箱验证码登录与注册；发送成功后 60 秒内不可重复发送，按钮显示倒计时
- Discord OAuth 登录入口（需部署时配置授权地址）
- 登录 / 注册页采用固定深色双栏布局，与品牌星空视觉统一
- 登录后保存 access token 与 refresh token Cookie
- 认证请求经 `/api/auth-proxy/**` 同源代理转发至后端
- 退出登录前二次确认，确认后清理本地会话

### 个人中心

- 游戏记录：LOL、VALORANT、CS2 等游戏时长和段位展示
- 数字钱包：账户余额、充值和陪玩提现入口
- 礼物与亲密度成就进度
- 历史订单：展示老板 / 陪玩服务、游戏、服务时长、金额及完成状态

> 当前个人中心的游戏、钱包、成就与订单为页面展示数据。接口文档尚未提供对应查询、充值或提现接口，接入后可替换为真实数据。

## 环境要求

- Node.js 22 或更高版本
- npm（工程已包含 `package-lock.json`）

本机如通过 nvm 管理 Node，请先切换到 Node 22：

```powershell
nvm use 22.20.0
```

## 本地启动

```powershell
cd D:\MyDevelop\Mystikos\Mystikos
npm ci
npm run dev
```

默认访问地址为：<http://127.0.0.1:3000>

常用命令：

```powershell
# 类型检查
npm run typecheck

# 生产构建
npm run build

# 本地预览生产构建
npm run preview
```

## 后端认证接口配置

默认后端地址为：`http://116.62.218.227:8099`。

部署到其他环境时，可通过环境变量覆盖：

```powershell
$env:NUXT_MYSTIKOS_API_BASE = 'https://api.example.com'
npm run dev
```

当前已绑定的认证接口：

| 功能 | 后端接口 |
| --- | --- |
| 密码 / 验证码登录 | `POST /api/v1/auth/login` |
| 发送验证码 | `POST /api/v1/auth/verification-codes` |
| 注册 | `POST /api/v1/auth/register` |
| 刷新令牌 | `POST /api/v1/auth/refresh-token` |
| OAuth 登录 | `POST /api/v1/auth/oauth/{provider}/login` |
| 退出登录 | `POST /api/v1/auth/logout` |
| 当前用户 | `GET /api/v1/auth/me` |

### Discord OAuth 配置

Discord OAuth 由后端发起并处理回调。前端只需要配置后端 API 地址：

```powershell
$env:NUXT_MYSTIKOS_API_BASE = 'http://your-api-host:8099'
```

后端运行环境需要配置：

```powershell
$env:DISCORD_CLIENT_ID = '你的 Discord Client ID'
$env:DISCORD_CLIENT_SECRET = '你的 Discord Client Secret'
$env:DISCORD_REDIRECT_URI = 'http://your-api-host:8099/api/v1/auth/oauth/discord/callback'
$env:OAUTH_FRONTEND_RETURN_URI = 'http://127.0.0.1:3000/auth'
```

将 `DISCORD_REDIRECT_URI` 的值原样添加到 **Discord Developer Portal → OAuth2 → Redirects**。后端使用 Redis 保存一次性 `state` 和 PKCE verifier；授权完成后仅把一分钟有效的一次性登录票据带回前端，Mystikos Token 不会出现在 URL 中。

## 工程结构

```text
app/
  components/          通用组件（导航、页脚、陪玩卡片等）
  composables/         多语言、主题、认证状态与 API 调用
  pages/               首页、商城、认证页、个人中心
  assets/css/          全局视觉样式与响应式规则
server/api/auth-proxy/ 同源认证接口代理
scripts/               安装后的运行环境兼容脚本
deploy/                PM2 与 Nginx 部署示例
```

## 生产打包与部署

### 1. 生成生产构建

```powershell
cd D:\MyDevelop\Mystikos\Mystikos
npm ci
npm run typecheck
npm run build
```

构建结果输出到 `.output/`。这是 Nuxt 的 Node 服务产物，不是纯静态站点；它包含认证接口代理，因此应使用 Node 服务方式部署：

```powershell
$env:NODE_ENV = 'production'
$env:HOST = '0.0.0.0'
$env:PORT = '3000'
$env:NUXT_MYSTIKOS_API_BASE = 'https://api.example.com'
node .output/server/index.mjs
```

### 2. 使用 Docker 部署（推荐）

项目根目录已提供 `Dockerfile` 与 `.dockerignore`：

```bash
docker build -t mystikos-web:latest .
docker run -d --name mystikos-web --restart unless-stopped \
  -p 3000:3000 \
  -e NUXT_MYSTIKOS_API_BASE=https://api.example.com \
  mystikos-web:latest
```

验证服务：

```bash
curl http://127.0.0.1:3000
docker logs -f mystikos-web
```

### 3. 使用 PM2 部署

适用于已安装 Node 22 的 Linux 服务器。先将项目发布到服务器目录（示例为 `/srv/mystikos-web`），再执行：

```bash
cd /srv/mystikos-web
npm ci
npm run build
npm install -g pm2
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup
```

根据真实环境修改 `deploy/ecosystem.config.cjs` 中的后端地址、端口和 Discord 授权地址。更新发布时：

```bash
npm ci
npm run build
pm2 reload mystikos-web --update-env
```

### 4. Nginx 反向代理与 HTTPS

将 `deploy/nginx.conf.example` 复制到 Nginx 站点配置目录，替换 `server_name` 后检查并重载：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

生产环境应为域名配置 HTTPS（例如使用 Certbot），并将所有 HTTP 请求跳转到 HTTPS。Nginx 配置已包含 Nuxt 开发工具及 WebSocket 所需的 Upgrade 请求头。

### 5. 环境变量

从 `.env.example` 复制一份作为部署环境参考：

```bash
cp .env.example .env
```

| 变量 | 说明 | 是否可公开 |
| --- | --- | --- |
| `NUXT_MYSTIKOS_API_BASE` | Mystikos 后端地址，仅由 Nuxt 服务端代理使用 | 否 |
| `HOST` / `PORT` | Nuxt Node 服务监听地址和端口 | 否 |

`.env` 文件不得提交到代码仓库。Docker 或 PM2 场景建议通过平台环境变量、密钥管理服务或 CI/CD 变量注入。

### 发布检查清单

- 使用 Node.js 22 运行构建和生产服务。
- 执行 `npm run typecheck` 与 `npm run build`，确保均成功。
- 将 `NUXT_MYSTIKOS_API_BASE` 指向生产后端，并确认服务器可以访问该地址。
- 配置 HTTPS 后验证登录、退出、认证代理和 Discord 回调。
- 不在镜像、配置文件或日志中保存密码、access token、refresh token。

## 注意事项

- 不要将真实密码、access token 或 refresh token 写入仓库、README 或前端源码。
- 充值、提现、订单与个人数据接口尚未在当前接口文档中提供；接入时应由后端校验用户身份与金额，前端不应自行计算余额。
- 生产环境建议使用 HTTPS，并将 Cookie 的 `secure` 属性设为 `true`。

## 变更记录

- 系统界面默认语言改为中文，仍可通过页头切换为英文。
- 注册与邮箱验证码登录：发送验证码成功后 60 秒内按钮禁用并显示倒计时。
- 字体改为 `@fontsource` 本地打包，移除 Google Fonts 外链，避免网络不可达时页面长时间白屏。
- 登录 / 注册页视觉重构：1:1 双栏、固定深色表单区、圆角输入框与浅色主按钮，样式独立至 `auth.css`。
- 修复登录页因旧样式冲突与 100vh 叠加导致的横向 / 页面级滚动条。
- 修复注册页顶部内容被裁切，并收紧注册表单间距。
- 接入 Noto Sans SC / Noto Serif SC 作为简体中文回退，与 Playfair Display、DM Sans 组成完整中英文字体栈。
- 登录页左侧按效果图重构：使用月亮切图居中展示，并叠加 Logo、页脚与分页指示。
