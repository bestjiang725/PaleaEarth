# 古地球气候剖面可视化系统 — 部署上线指南

> 从本地开发 → 生产环境部署的完整操作手册。

---

## 目录

1. [部署前准备](#1-部署前准备)
2. [方案 A：单机 Docker Compose（推荐起步）](#2-方案-a单机-docker-compose推荐起步)
3. [方案 B：阿里云全套部署（企业级）](#3-方案-b阿里云全套部署企业级)
4. [方案 C：轻量 VPS 手动部署](#4-方案-c轻量-vps-手动部署)
5. [数据初始化](#5-数据初始化)
6. [HTTPS 配置](#6-https-配置)
7. [监控与运维](#7-监控与运维)
8. [故障排查](#8-故障排查)

---

## 1. 部署前准备

### 生产环境需要的改动

当前本地开发环境使用：
- **SQLite** → 生产改用 **PostgreSQL**
- **内存任务队列** → 生产改用 **Redis + Celery**
- **本地文件存储** → 生产可用 **阿里云 OSS** 或 **NAS/Volume**
- **matplotlib 渲染** → 保持不变（已适配 headless 模式）

这些改动**不需要修改业务代码**——只需通过环境变量切换配置。

### 你需要准备的

| 资源 | 方案 A | 方案 B | 方案 C |
|------|--------|--------|--------|
| 服务器 | 1台 ECS/VPS（4C8G） | 阿里云多产品 | 1台 VPS（2C4G 起步） |
| 域名 | 推荐 | 必须 | 推荐 |
| Docker | ✅ 必需 | ✅ 必需 | 可选 |
| 预算（月） | ~300-500 元 | ~3000-5000 元 | ~100-200 元 |

---

## 2. 方案 A：单机 Docker Compose（推荐起步）

> 适合：项目初期、小团队、日访问量 < 10 万次。一台服务器搞定所有。

### 2.1 服务器配置

- **规格**：4C8G（阿里云 ecs.c7.xlarge / 腾讯云 S5.MEDIUM4）
- **系统**：Ubuntu 22.04 LTS 或 Alibaba Cloud Linux 3
- **磁盘**：系统盘 40GB + 数据盘 100GB
- **带宽**：5-10 Mbps

### 2.2 部署步骤

```bash
# ─── 1. 本地准备 ───
# 确保 Docker Desktop 已安装，在项目根目录执行

# 构建镜像
docker compose -f docker-compose.prod.yml build

# 测试启动（本地验证）
docker compose -f docker-compose.prod.yml up -d
curl http://localhost/api/v1/health
docker compose -f docker-compose.prod.yml down

# ─── 2. 服务器环境 ───
ssh root@<your-server-ip>

# 安装 Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# 安装 Docker Compose
apt install -y docker-compose-plugin  # Ubuntu
# 或
yum install -y docker-compose-plugin  # CentOS/Alibaba Linux

# ─── 3. 上传项目 ───
# 在本地执行
rsync -avz --exclude 'node_modules' --exclude '.git' \
  --exclude 'backend/venv' --exclude 'frontend/dist' \
  --exclude '*.db' \
  ./ root@<your-server-ip>:/opt/paleoearth/

# ─── 4. 上传 NC 数据到服务器 ───
# 在本地执行（约 100MB）
rsync -avz ./data/*.nc root@<your-server-ip>:/opt/paleoearth/data/

# ─── 5. 服务器上启动 ───
ssh root@<your-server-ip>
cd /opt/paleoearth

# 设置数据库密码（务必修改）
echo "DB_PASSWORD=$(openssl rand -hex 16)" > .env.prod.secrets

# 构建并启动
docker compose -f docker-compose.prod.yml up -d --build

# 查看状态
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs backend

# ─── 6. 初始化数据 ───
# 等待 PostgreSQL 就绪后执行
docker compose -f docker-compose.prod.yml exec backend python -m app.scripts.index_data

# ─── 7. 验证 ───
curl http://localhost/api/v1/health
curl http://localhost/api/v1/time/ages
```

### 2.3 更新部署

```bash
# 本地构建新镜像 → 推送/上传 → 服务器重启
cd /opt/paleoearth
git pull  # 或 rsync 更新代码
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 3. 方案 B：阿里云全套部署（企业级）

> 适合：正式上线、公开展示、需要高可用和 CDN 加速。

### 3.1 产品清单

| 产品 | 用途 | 最低规格 | 月费估算 |
|------|------|----------|----------|
| ECS ×2 | 应用服务器 | 4C8G | ¥600 ×2 |
| RDS PostgreSQL | 元数据库 | 2C4G 基础版 | ¥400 |
| Redis | 缓存/队列 | 1GB 标准版 | ¥200 |
| OSS | NC文件+瓦片存储 | 标准存储 100GB | ¥20 |
| CDN/DCDN | 瓦片全球加速 | 按流量 | ¥100 |
| SLB | 负载均衡 | 公网 | ¥200 |
| WAF | Web防护 | 基础版 | ¥500 |
| NAS | Worker共享存储 | 通用SSD 50GB | ¥150 |
| **合计** | | | **~¥3000/月** |

### 3.2 部署架构

```
用户 → CDN/WAF → SLB → ECS×2 (Nginx+FastAPI)
                           ↓
                    RDS PG + Redis + OSS
                           ↓
                    ECS×1 (Celery Worker) + NAS
```

### 3.3 部署步骤

#### 第一阶段：阿里云基础设施

```bash
# 1. 创建 VPC 网络
aliyun vpc CreateVpc --vpc-name paleoearth-vpc --cidr-block 10.0.0.0/16 --region cn-hangzhou

# 2. 创建交换机
aliyun vpc CreateVSwitch \
  --v-switch-name paleoearth-switch \
  --vpc-id <vpc-id> \
  --cidr-block 10.0.1.0/24 \
  --zone-id cn-hangzhou-g

# 3. 创建安全组
aliyun ecs CreateSecurityGroup \
  --security-group-name paleoearth-sg \
  --vpc-id <vpc-id> \
  --region cn-hangzhou

# 添加规则：开放 80(HTTP), 443(HTTPS), 22(SSH)
aliyun ecs AuthorizeSecurityGroup \
  --security-group-id <sg-id> \
  --ip-protocol tcp --port-range 80/80 --source-cidr 0.0.0.0/0
aliyun ecs AuthorizeSecurityGroup \
  --security-group-id <sg-id> \
  --ip-protocol tcp --port-range 443/443 --source-cidr 0.0.0.0/0

# 4. 创建 ECS（3台，在控制台或 CLI）
# ECS-1, ECS-2: 运行 Nginx + FastAPI (Web)
# ECS-3: 运行 Celery Worker
# 推荐镜像: Alibaba Cloud Linux 3 / Ubuntu 22.04

# 5. 创建 RDS PostgreSQL 15 + PostGIS 插件
# 控制台 → 数据库 → RDS → 创建实例
# 选择: PostgreSQL 15, 专有网络, 不暴露公网

# 6. 创建 Redis
# 控制台 → 数据库 → Redis → 创建实例
# 选择: 标准版, 2GB, 专有网络

# 7. 创建 OSS Bucket
aliyun oss mb oss://paleoearth-nc-data --region cn-hangzhou
aliyun oss mb oss://paleoearth-tiles --region cn-hangzhou

# 8. 创建 NAS 文件系统
# 控制台 → 文件存储 NAS → 创建文件系统
# 挂载点到 /mnt/nas
```

#### 第二阶段：构建与推送镜像

```bash
# 在本地项目根目录
cd d:/古生物建模

# 登录阿里云容器镜像服务 ACR
docker login --username=<your-aliyun-account> registry.cn-hangzhou.aliyuncs.com

# 构建并推送后端
docker build -t registry.cn-hangzhou.aliyuncs.com/paleoearth/backend:latest ./backend
docker push registry.cn-hangzhou.aliyuncs.com/paleoearth/backend:latest

# 构建并推送前端
docker build -t registry.cn-hangzhou.aliyuncs.com/paleoearth/frontend:latest ./frontend
docker push registry.cn-hangzhou.aliyuncs.com/paleoearth/frontend:latest
```

#### 第三阶段：应用部署

```bash
# 1. 上传 NC 数据到 OSS
aliyun oss cp -r ./data/ oss://paleoearth-nc-data/nc-files/ --recursive

# 2. 在 ECS-1 和 ECS-2 上部署
ssh root@<ecs-1-ip>
yum install -y docker
systemctl start docker

# 拉取镜像
docker pull registry.cn-hangzhou.aliyuncs.com/paleoearth/backend:latest
docker pull registry.cn-hangzhou.aliyuncs.com/paleoearth/frontend:latest

# 创建 docker-compose.prod.yml，使用 ACR 镜像
# 在 ECS-1/2 上运行：
docker compose up -d

# 3. 在 ECS-3 上部署 Celery Worker
docker pull registry.cn-hangzhou.aliyuncs.com/paleoearth/backend:latest
docker run -d \
  --name celery-worker \
  -v /mnt/nas:/data \
  -e DATABASE_URL=postgresql+asyncpg://... \
  -e REDIS_URL=redis://... \
  registry.cn-hangzhou.aliyuncs.com/paleoearth/backend:latest \
  celery -A app.tasks.celery_app worker -l info -c 4

# 4. 配置 CDN
# 控制台 → CDN → 添加域名
# 源站: paleoearth-tiles.oss-cn-hangzhou.aliyuncs.com
# 加速域名: cdn.your-domain.com

# 5. 配置 SLB + 域名 DNS
# 域名 A 记录 → SLB 公网 IP
# SLB 后端: ECS-1, ECS-2 的 80 端口
```

---

## 4. 方案 C：轻量 VPS 手动部署

> 适合：演示用途、个人项目。最低 2C4G VPS。

### 4.1 部署脚本（在服务器上执行）

```bash
# ─── 1. 基础环境 ───
sudo apt update && sudo apt install -y python3.13 python3.13-venv nginx

# ─── 2. 创建应用目录 ───
sudo mkdir -p /opt/paleoearth
sudo chown $USER:$USER /opt/paleoearth

# ─── 3. 上传代码（从本地 rsync 或 git clone）───
cd /opt/paleoearth

# ─── 4. 后端 ───
cd backend
python3.13 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn

# 复制并编辑环境变量
cp .env.example .env
# 编辑 .env: DATABASE_URL 指向 PostgreSQL（或保持 SQLite 用于最简部署）

# 初始化数据
python -m app.scripts.index_data

# 创建 systemd 服务
sudo tee /etc/systemd/system/paleoearth-api.service << 'EOF'
[Unit]
Description=PaleoEarth FastAPI
After=network.target

[Service]
User=www-data
WorkingDirectory=/opt/paleoearth/backend
ExecStart=/opt/paleoearth/backend/venv/bin/gunicorn \
  -k uvicorn.workers.UvicornWorker -w 4 \
  --bind 127.0.0.1:8000 app.main:app
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable paleoearth-api
sudo systemctl start paleoearth-api

# ─── 5. 前端 ───
cd /opt/paleoearth/frontend
npm ci && npm run build

# ─── 6. Nginx ───
sudo tee /etc/nginx/sites-available/paleoearth << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    root /opt/paleoearth/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /storage/ {
        proxy_pass http://127.0.0.1:8000;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/paleoearth /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 5. 数据初始化

部署完成后需要在服务器上执行数据索引：

```bash
# Docker 方案
docker compose -f docker-compose.prod.yml exec backend python -m app.scripts.index_data

# 手动方案
cd /opt/paleoearth/backend
source venv/bin/activate
python -m app.scripts.index_data
```

### 预生成常用覆盖图（可选，加速首次访问）

```bash
# 在后端容器内或服务器上执行
for age in 430 436 441 444 449 455 460 465 470 475 481 485 491 495 498 505; do
  for var in temp_mm_srf precip_mm_srf totCloud_mm_ua iceconc_mm_srf; do
    curl -s -X POST http://localhost:8000/api/v1/generate/overlay \
      -H "Content-Type: application/json" \
      -d "{\"age_ma\":${age},\"var_name\":\"${var}\"}" &
  done
done
wait
echo "All overlays pre-generated"
```

全量预生成（16 年龄 × 38 变量 = 608 张），约占用磁盘 150MB，耗时 10-20 分钟。

---

## 6. HTTPS 配置

### 使用 Let's Encrypt（免费）

```bash
# 安装 certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期（已内置）
sudo certbot renew --dry-run
```

### 阿里云 SSL 证书（免费 20 个/年）

控制台 → SSL 证书 → 免费证书 → 下载 Nginx 版 → 上传到服务器的 `/etc/nginx/ssl/`

---

## 7. 监控与运维

### 基础监控（所有方案通用）

```bash
# 容器状态（Docker 方案）
docker compose -f docker-compose.prod.yml ps
docker stats

# 日志查看
docker compose -f docker-compose.prod.yml logs -f --tail=100 backend

# 磁盘使用
df -h
du -sh /opt/paleoearth/backend/app/storage/overlays/
```

### 健康检查端点

```
GET /api/v1/health       # 公开健康检查
GET /api/v1/admin/health # 含 DB 连接检查
GET /api/v1/admin/stats  # 系统统计（总年龄数、变量数、任务数）
```

### 推荐监控工具

| 工具 | 用途 | 部署难度 |
|------|------|----------|
| Prometheus + Grafana | API 延迟、QPS、系统资源 | 中 |
| Sentry（免费版） | 应用异常追踪 | 低 |
| 阿里云云监控 | 基础设施监控（方案B已含） | 无需部署 |
| UptimeRobot（免费） | HTTP 可用性探测 | 零 |

### 关键告警

- API 5xx 率 > 5% → 检查后端日志
- 响应时间 > 5s → 检查是否有大量覆盖图生成
- 磁盘 > 80% → 清理旧覆盖图缓存
- 进程 CPU > 90% 持续 15 分钟 → 扩容

---

## 8. 故障排查

### 覆盖图不显示

```bash
# 1. 检查后端是否正常
curl http://localhost:8000/api/v1/health

# 2. 检查覆盖图端点
curl -I http://localhost:8000/api/v1/tiles/overlay/430/temp_mm_srf.png

# 3. 查看生成日志
docker logs <container-id> 2>&1 | grep -i error

# 4. 检查存储空间
ls -lh /opt/paleoearth/backend/app/storage/overlays/
```

### 数据库连接失败

```bash
# 检查 PostgreSQL 是否运行
docker compose -f docker-compose.prod.yml ps postgres

# 测试连接
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U paleoearth -d paleoearth -c "SELECT count(*) FROM time_mapping;"
```

### 内存不足导致 matplotlib 崩溃

```bash
# 限制 gunicorn worker 数量
gunicorn -k uvicorn.workers.UvicornWorker -w 2 app.main:app  # 从 4 降到 2

# 或降低覆盖图分辨率
# 编辑 .env.production: OVERLAY_WIDTH=1024, OVERLAY_HEIGHT=512
```

### 性能优化建议

1. **覆盖图缓存**：已自动缓存，首次请求生成，后续直接返回
2. **Nginx 缓存**：在 nginx.conf 中添加 `proxy_cache` 指令
3. **CDN 加速**：覆盖图通过 CDN 分发，减少服务器压力
4. **预热**：部署后批量预生成所有常用覆盖图
5. **硬件升级**：4C8G → 8C16G，覆盖图生成速度翻倍

---

## 附录：环境变量完整清单

```ini
# 应用
APP_NAME=PaleoEarth
APP_VERSION=1.0.0
DEBUG=false
SECRET_KEY=<随机64字符>

# 数据库（SQLite 开发 / PostgreSQL 生产）
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/paleoearth
DATABASE_URL_SYNC=postgresql://user:pass@host:5432/paleoearth

# Redis
REDIS_URL=redis://:password@host:6379/0

# 存储
DATA_DIR=/data/nc-files
STORAGE_DIR=/app/app/storage

# 覆盖图渲染
OVERLAY_WIDTH=2048
OVERLAY_HEIGHT=1024

# CORS
CORS_ORIGINS=https://your-domain.com

# JWT（管理接口）
JWT_SECRET_KEY=<随机密钥>
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
```
