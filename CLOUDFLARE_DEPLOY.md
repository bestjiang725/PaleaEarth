# Cloudflare 免费部署指南 — 个人展示方案

> 零成本、全球加速、自动 HTTPS。适合个人项目展示和演示。

---

## 方案总览

```
用户浏览器
    │
    ▼
┌──────────────────────────────────────┐
│         Cloudflare Pages             │  免费, 无限带宽
│    https://paleoearth.pages.dev      │  前端静态文件 (React)
└────────────┬─────────────────────────┘
             │ API: /api/*  /storage/*
             ▼
┌──────────────────────────────────────┐
│       Cloudflare Tunnel              │  免费, 自动 HTTPS
│    https://api.xxx.trycloudflare.com │  安全隧道 (无需公网 IP)
└────────────┬─────────────────────────┘
             │ localhost:8000
             ▼
┌──────────────────────────────────────┐
│        你的 Windows PC               │
│    FastAPI + matplotlib 覆盖图生成    │
│    展示时开机即可                     │
└──────────────────────────────────────┘
```

**费用：¥0/月** — Cloudflare Pages 免费、Tunnel 免费、无需服务器。

---

## 第一步：Cloudflare Pages 部署前端

### 1.1 安装 Wrangler CLI

```powershell
# Windows PowerShell
npm install -g wrangler
wrangler login
```

### 1.2 创建 Cloudflare Pages 项目

```bash
cd d:/古生物建模/frontend

# 构建前端
npm run build
```

### 1.3 直接部署（命令行）

```bash
# 进入 frontend 目录
cd d:/古生物建模/frontend

# 部署 dist 目录到 Cloudflare Pages
npx wrangler pages deploy dist --project-name=paleoearth

# 第一次运行会让你创建项目，之后每次只需：
npx wrangler pages deploy dist --project-name=paleoearth
```

部署完成后，前端访问地址：`https://paleoearth.pages.dev`

### 1.4 自动部署（通过 GitHub）

将项目推送到 GitHub，然后在 Cloudflare Dashboard 中：

1. 进入 **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. 选择你的 GitHub 仓库
3. 构建配置：
   - **Build command**: `cd frontend && npm ci && npm run build`
   - **Build output directory**: `frontend/dist`
4. 每次 `git push` 自动部署

---

## 第二步：Cloudflare Tunnel 暴露后端

Cloudflare Tunnel 在你电脑和 Cloudflare 边缘节点之间建立加密隧道，让你的本地后端可以从公网访问。

### 2.1 安装 cloudflared

```powershell
# Windows (PowerShell 管理员模式)
winget install --id Cloudflare.cloudflared

# 或者下载安装包
# https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
```

验证安装：
```bash
cloudflared --version
```

### 2.2 创建 Tunnel

```bash
# 登录 Cloudflare
cloudflared tunnel login

# 创建隧道
cloudflared tunnel create paleoearth-backend

# 输出类似：
# Created tunnel paleoearth-backend with id xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 2.3 配置 Tunnel

创建配置文件 `C:\Users\<你的用户名>\.cloudflared\config.yml`：

```yaml
tunnel: <你的tunnel-id>
credentials-file: C:\Users\<你的用户名>\.cloudflared\<tunnel-id>.json

ingress:
  # 后端 API
  - hostname: api.paleoearth.example.com
    service: http://localhost:8000
  # 或者使用 trycloudflare 快速测试域名（不需要自己的域名）
  - service: http://localhost:8000
```

**注意**：如果用 `trycloudflare` 快速域名（无需自己域名），配置更简单：

```yaml
tunnel: <你的tunnel-id>
credentials-file: C:\Users\<你的用户名>\.cloudflared\<tunnel-id>.json

ingress:
  - service: http://localhost:8000
```

### 2.4 启动 Tunnel

```bash
# 启动隧道（使用快速测试域名）
cloudflared tunnel run paleoearth-backend

# 或者使用临时测试域名（无需创建 tunnel）
cloudflared tunnel --url http://localhost:8000
```

启动后会显示：
```
2026-06-17T10:00:00Z INF Requesting new quick Tunnel on trycloudflare.com...
2026-06-17T10:00:05Z INF +------------------------------------------------------------+
2026-06-17T10:00:05Z INF |  Your quick Tunnel has been created!                      |
2026-06-17T10:00:05Z INF |  https://random-words.trycloudflare.com → localhost:8000   |
2026-06-17T10:00:05Z INF +------------------------------------------------------------+
```

记下这个 URL，例如 `https://paleoearth-backend-random.trycloudflare.com`

### 2.5 设为 Windows 服务（开机自启）

```powershell
# 管理员 PowerShell
cloudflared service install

# 配置文件在 C:\Users\<用户名>\.cloudflared\config.yml
# 启动服务
cloudflared service start
```

---

## 第三步：连接前后端

### 3.1 更新前端 API 地址

前端需要知道后端 Tunnel URL。编辑 `frontend/.env.production`：

```env
VITE_API_BASE_URL=https://your-tunnel-url.trycloudflare.com
```

更新 `frontend/src/api/client.ts`：

```typescript
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api/v1`
    : '/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})
```

### 3.2 更新后端 CORS

编辑 `backend/.env`，添加 Pages 域名和 Tunnel 域名：

```env
CORS_ORIGINS=https://paleoearth.pages.dev,https://*.trycloudflare.com,http://localhost:5173
```

### 3.3 重新部署前端

```bash
cd d:/古生物建模/frontend

# 构建（使用生产环境变量）
npm run build

# 部署到 Pages
npx wrangler pages deploy dist --project-name=paleoearth
```

---

## 第四步：展示/演示

### 日常演示流程

```bash
# 1. 启动后端（在你电脑上）
cd d:/古生物建模/backend
uvicorn app.main:app --host 0.0.0.0 --port 8000

# 2. 另开终端，启动 Tunnel（如果没用 Windows 服务）
cloudflared tunnel --url http://localhost:8000

# 3. 打开浏览器访问
# https://paleoearth.pages.dev
```

### 使用自定义域名（推荐）

如果你有自己的域名（如 `paleoearth.com`），可以添加到 Cloudflare：

1. 在 Cloudflare Dashboard 中添加域名
2. 将域名 Nameserver 指向 Cloudflare
3. 配置 Tunnel 使用自定义子域名：

```yaml
# config.yml
ingress:
  - hostname: api.paleoearth.com
    service: http://localhost:8000
  - hostname: paleoearth.com
    service: http://localhost:8000
```

4. 在 Cloudflare DNS 中添加 CNAME 记录：
   - `api` → `<tunnel-id>.cfargotunnel.com`
   - `@` → Cloudflare Pages

---

## 完整生产环境变量

### `frontend/.env.production`

```env
# 如果使用 Cloudflare Tunnel（每次域名可能变化）
VITE_API_BASE_URL=https://your-tunnel-name.trycloudflare.com

# 如果使用固定域名
# VITE_API_BASE_URL=https://api.paleoearth.com

# 如果前后端通过同一个 Tunnel（不推荐，但最简单）
# VITE_API_BASE_URL=
```

### `backend/.env`（添加 CORS 配置）

```env
CORS_ORIGINS=https://paleoearth.pages.dev,https://*.trycloudflare.com,http://localhost:5173
```

---

## 快速开始（最简方案，5 分钟上线）

如果你只是想快速展示给别人看，不需要永久域名：

```bash
# 终端 1：启动后端
cd d:/古生物建模/backend
uvicorn app.main:app --host 0.0.0.0 --port 8000

# 终端 2：启动 Tunnel
cloudflared tunnel --url http://localhost:8000
# 复制输出的 https://xxx.trycloudflare.com URL

# 终端 3：构建并部署前端（API 指向 Tunnel URL）
cd d:/古生物建模/frontend
$env:VITE_API_BASE_URL="https://xxx.trycloudflare.com"
npm run build
npx wrangler pages deploy dist --project-name=paleoearth
```

把 `https://paleoearth.pages.dev` 发给别人就能访问了。

---

## 架构决策说明

| 为什么用这个方案 | 说明 |
|------------------|------|
| **Pages 而不是 Workers** | Pages 专为静态站点优化，全球 330+ 节点 CDN，自动 HTTPS |
| **Tunnel 而不是买服务器** | 免费、安全、无需公网 IP，你的 PC 就是服务器 |
| **matplotlib 在本地运行** | Cloudflare Workers 不支持 Python/C 扩展，渲染必须在本地 |
| **前端分离部署** | 前端享受 CDN 加速，后端按需启动 |

---

## 限制与注意事项

1. **你的电脑需要开机**：展示时后端必须在运行
2. **Tunnel 临时域名会变**：每次重启 `cloudflared tunnel --url` 会生成新域名，需要重新部署前端。解决方案：
   - 使用固定 Tunnel 名称 + 自定义域名（推荐）
   - 或者用同一个 Tunnel 同时代理前端和后端
3. **带宽限制**：Cloudflare 免费套餐无明确带宽限制，但 TOS 禁止 serving 非 HTML 内容为主（我们的覆盖图 PNG 通过 API，量不大没问题）
4. **首次访问慢**：覆盖图首次生成需要 2-5 秒（matplotlib 渲染），之后缓存

---

## 进阶：全 Tunnel 方案（更简单）

如果你不想分离前后端部署，可以用 Tunnel 暴露整个应用：

```yaml
# cloudflared config.yml
ingress:
  - service: http://localhost:8000
```

FastAPI 同时服务前端静态文件和 API（需要配置 StaticFiles mount）：

后端已配置 `/api/*` 路由和 `/storage/*` 静态文件。只需添加前端静态文件服务，整个系统就通过一个 Tunnel URL 访问。

此方案优点：**一个 URL，零配置，直接分享**。
缺点：前端不走 CDN，访问速度取决于你的上行带宽。

---

## 相关链接

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Cloudflare Tunnel 文档](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [cloudflared 下载](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)
