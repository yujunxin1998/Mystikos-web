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

- 品牌首页：首屏双 CTA（陪玩清单 / 奇物商城），精选陪玩可跳转清单；排行榜 / 会员 / 亲密度后置并标「预览」
- 顶栏收敛为「陪玩 / 商城 / 我的」，心愿单与点单车为右侧入口；主题、语言、退出收入头像菜单
- 奇物商城：星轨藏品视觉、分类筛选、商品详情弹层、后端心愿单与购物车，并提供商品图片失败回退
- 默认中文，支持中英文切换
- 明亮 / 暗黑主题切换
- 桌面端与移动端自适应，支持减少动态效果偏好

### 个人中心

- Tab：资料、安全、订单、钱包
- 资料：昵称 / 头像 / 地区等编辑，以及陪玩申请入口（接真实接口）
- 安全：邮箱 / 手机验证（账号安全页仍可直接访问）
- 订单与钱包：当前为页面展示示例数据，已标注「示例 / 即将上线」

### 认证

- 账号密码登录：后端定义的邮箱或手机号格式；提交前获取服务端公钥并使用 RSA-OAEP/SHA-256 加密密码
- 邮箱验证码登录与注册；发送成功后 60 秒内不可重复发送，按钮显示倒计时
- Discord OAuth 登录入口（需部署时配置授权地址）
- 登录 / 注册页采用固定深色双栏布局，与品牌星空视觉统一
- 登录后保存 access token 与 refresh token Cookie
- 认证请求经 `/api/auth-proxy/**` 同源代理转发至后端
- 退出登录前二次确认，确认后清理本地会话

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

默认后端地址为：`https://www.joinmystikos.com`。

部署到其他环境时，可通过环境变量覆盖：

```powershell
$env:NUXT_MYSTIKOS_API_BASE = 'https://www.joinmystikos.com'
npm run dev
```

当前已绑定的认证接口：

| 功能 | 后端接口 |
| --- | --- |
| 获取密码登录公钥 | `GET /api/v1/auth/public-key` |
| 密码 / 验证码登录 | `POST /api/v1/auth/login` |
| 发送验证码 | `POST /api/v1/auth/verification-codes` |
| 注册 | `POST /api/v1/auth/register` |
| 刷新令牌 | `POST /api/v1/auth/refresh-token` |
| OAuth 登录 | `POST /api/v1/auth/oauth/{provider}/login` |
| 退出登录 | `POST /api/v1/auth/logout` |
| 当前用户 | `GET /api/v1/auth/me` |

### 密码登录加密

密码登录不会把明文密码写入登录请求。前端首先通过同源代理请求 `GET /api/v1/auth/public-key`，导入接口返回的 X.509 SPKI PEM 公钥，再使用浏览器 Web Crypto API 按 `RSA-OAEP-256`（RSA-OAEP + SHA-256）加密密码。登录请求仅提交公钥版本 `keyId` 和 Base64 密文 `encryptedCredential`。

非对称加密开关由环境变量 `NUXT_PUBLIC_PASSWORD_ENCRYPTION_ENABLED` 控制，默认开启，默认值定义在 `config/security.config.ts`（部署时可直接编辑该文件）。设为 `false` 后，登录不再获取公钥，改按 `{ credentialType: 'PASSWORD', credential: <明文密码> }` 直接提交，仅用于后端同样关闭非对称加密的联调 / 测试环境。

公钥缺失、算法不是 `RSA-OAEP-256`、浏览器不支持 Web Crypto 或加密失败时，登录会直接终止，不会降级发送明文密码。验证码登录不需要 RSA 加密。注册接口目前仍按后端文档提交 `password`，待后端注册协议提供对应密文字段后再升级。

> RSA 登录加密不能替代 HTTPS：生产环境仍必须使用 HTTPS，才能同时保护账号标识、验证码、Token、响应内容以及请求完整性。

### Discord OAuth 配置

Discord OAuth 由后端发起并处理回调。前端只需要配置后端 API 地址：

```powershell
$env:NUXT_MYSTIKOS_API_BASE = 'https://www.joinmystikos.com'
```

后端运行环境需要配置：

```powershell
$env:DISCORD_CLIENT_ID = '你的 Discord Client ID'
$env:DISCORD_CLIENT_SECRET = '你的 Discord Client Secret'
$env:DISCORD_REDIRECT_URI = 'https://www.joinmystikos.com/api/v1/auth/oauth/discord/callback'
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
$env:NUXT_MYSTIKOS_API_BASE = 'https://www.joinmystikos.com'
node .output/server/index.mjs
```

### 2. 使用 Docker 部署（推荐）

项目根目录已提供 `Dockerfile` 与 `.dockerignore`：

```bash
docker build -t mystikos-web:latest .
docker run -d --name mystikos-web --restart unless-stopped \
  -p 3000:3000 \
  -e NUXT_MYSTIKOS_API_BASE=https://www.joinmystikos.com \
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
| `NUXT_PUBLIC_PASSWORD_ENCRYPTION_ENABLED` | 密码登录 RSA 非对称加密开关，默认开启 | 是 |
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

- 商城页登录后预拉心愿单 / 购物车 / 地址失败时改为静默容错，不再弹出「操作未完成」打断商品浏览。
- 个人中心订单页精修：扁表格改为主题变量驱动的档案卡片列表，状态徽标与钱包页气质对齐。
- 个人中心钱包页再精修：左右分栏余额卡、克制装饰环，并完整接入明暗主题 token（浅色暖卡 / 深色星群卡）。
- 个人中心钱包页重做：去掉重复标签与粗按钮，改为主题变量驱动的精致余额卡与胶囊操作，并补充预览态指标条。
- 个人中心四个页签统一为双主题星象视觉：资料页采用轨道头像与分层身份卡，安全、订单、钱包共享紫金面板体系；保留现有资料、验证、订单和钱包交互。
- 个人中心样式独立至 `profile.css`，页签解析与 URL 导航抽取为可测试工具，避免视觉重构影响原有路由状态。
- 首页精选陪玩卡 CTA 改为「点单」按钮样式。
- 顶栏心愿单 / 点单车改为同尺寸圆形线框 SVG 图标，角标缩小并贴齐右上角。
- 个人中心安全 Tab：去掉「账号安全 / 密码与登录保护」重复入口；邮箱与手机验证卡片统一标题、状态徽标与输入行层级。
- 顶栏心愿单角标改为空心爱心 + 右上桃色圆形数量徽标（对齐设计示意）。
- 个人中心资料区：账号邮箱与陪玩身份标题避免尴尬断行（账号单行省略，标题放宽并启用 pretty 换行）。
- 修复陪玩清单搜索框与失败态图标错位：搜索图标垂直居中，失败态改用清晰符号，并收紧工具栏与列表间距。
- 陪玩相关用户文案统一将「预约」改为「点单」（卡片 CTA、点单车、详情与错误提示等）；接口路径与代码标识不变。
- 陪玩清单失败 / 空态重设计：去掉拉满宽的「重新加载」按钮与虚线框，改为居中卡片 + 紧凑主按钮，并隐藏原始英文报错文案。
- 重建全站字体层级：引入 `--text-xs`～`--text-2xl` 阶梯，正文 16px 起步；页脚栏目标题与链接拉开层级，消除 8–11px 过小字号。
- 整体抬高可读字号：眉题、陪玩清单说明/筛选标签、导航与按钮等偏小文案加大。
- 按 [`docs/ux-redesign-2026-09.md`](./docs/ux-redesign-2026-09.md) 完成体验收敛：顶栏三条主导航、首页双 CTA、个人中心资料/安全/订单/钱包 Tab；Logo 与接口绑定保持不变。
- 新增体验收敛改版说明：[`docs/ux-redesign-2026-09.md`](./docs/ux-redesign-2026-09.md)（含导航 / 首页 / 个人中心设计示意与验收清单；Logo 保持现状，不破坏既有接口绑定）。
- 顶部导航改为随页面滚动，不再固定吸顶；同步去掉为主内容预留的顶部留白，以及陪玩清单筛选条相对固定导航的偏移。
- 系统界面默认语言改为中文，仍可通过页头切换为英文。
- 注册与邮箱验证码登录：发送验证码成功后 60 秒内按钮禁用并显示倒计时。
- 字体改为 `@fontsource` 本地打包，移除 Google Fonts 外链，避免网络不可达时页面长时间白屏。
- 登录 / 注册页视觉重构：1:1 双栏、固定深色表单区、圆角输入框与浅色主按钮，样式独立至 `auth.css`。
- 修复登录页因旧样式冲突与 100vh 叠加导致的横向 / 页面级滚动条。
- 修复注册页顶部内容被裁切，并收紧注册表单间距。
- 接入 Noto Sans SC / Noto Serif SC 作为简体中文回退，与 Playfair Display、DM Sans 组成完整中英文字体栈。
- 登录页左侧按效果图重构：使用月亮切图居中展示，并叠加 Logo、页脚与分页指示。
- 登录页左侧切图更新为含文案的完整主视觉（Stories written in starlight），去掉重复页脚文案。
- 登录页按第二版效果图提亮紫晕背景、放大主视觉与表单字号，并补回页脚 / Guild 眉题。
- 去掉左侧过糊的 CSS 光晕层；注册页进一步压缩间距，避免右侧出现滚动条。
- 左侧主视觉改为在舞台内完整 contain，避免放大裁切导致两侧轨道线消失。
- 固定「首页」与模式 Tab 位置：表单顶对齐，切换登录/注册不再上下跳动。
- 品牌标志替换为新的 Mystikos 图标资源，并以 currentColor 蒙版适配深浅主题。
- 登录页左侧仅保留放大后的品牌图标，隐藏旁侧 Mystikos 文字。
- 商城接入后端 Commerce 全部 12 个接口：商品列表与详情、购物车、心愿单、创建/查询/取消订单及发起支付；新增购物车抽屉、收货地址结算和订单详情页面。支付初始化会展示支付状态，完成银行卡付款仍需配置 Stripe Payment Element。
- 顶部心愿单入口改为后端共享状态，显示真实收藏总数；点击后打开汇总抽屉，展示总金额、收藏时间，并支持移除商品或加入购物车。
- 商城订单的后端 `Long`/雪花 ID 在代理和页面路由中统一按字符串传递，避免超过 JavaScript 安全整数范围后查询、取消或支付错单。

### 商城接口

商城页面通过 `/api/auth-proxy/**` 同源代理访问 `GET /api/v1/products`、购物车、心愿单和订单接口。商品目录可匿名浏览；购物车、心愿单、下单、取消和支付操作使用当前登录用户的 Bearer Token，未登录操作会跳转登录并在成功后返回商城。
