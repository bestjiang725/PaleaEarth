# 古地球气候剖面可视化系统 — 架构文档

> **项目名称**：PaleoEarth Visualizer（古地球气候剖面可视化系统）
> **版本**：v1.0
> **更新日期**：2026-06-16

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术选型](#2-技术选型)
3. [系统架构](#3-系统架构)
4. [前端架构](#4-前端架构)
5. [后端架构](#5-后端架构)
6. [数据处理管线](#6-数据处理管线)
7. [数据库设计](#7-数据库设计)
8. [接口设计摘要](#8-接口设计摘要)
9. [阿里云部署方案](#9-阿里云部署方案)
10. [开发环境搭建](#10-开发环境搭建)
11. [CI/CD 流水线](#11-cicd-流水线)
12. [监控与运维](#12-监控与运维)
13. [安全设计](#13-安全设计)
14. [项目路线图](#14-项目路线图)

---

## 1. 项目概述

### 1.1 项目背景

本系统旨在为古气候研究者提供一套 Web 工具，通过给定地质年代（如 430Ma，即 4.3 亿年前），生成并可视化地球全球气候剖面数据（NetCDF 格式），直观展示古地球不同地域的气候属性。

### 1.2 核心功能

- **时间轴选择**：用户指定地质年代（百万年前 / Ma），系统定位对应的气候模拟数据
- **多属性切换**：支持 20+ 气候变量（温度、降水、风场、气压、云量、辐射、通量、海冰、积雪、径流等）
- **全球地图渲染**：基于 WebGL/Canvas 的地球剖面可视化
- **NC 文件生成与下载**：按需生成 NetCDF 文件并支持下载
- **时间序列动画**：连续时间段的动态播放

### 1.3 气候属性清单

| 序号 | 变量名                  | 中文名称         | 单位          |
|------|-------------------------|------------------|---------------|
| 1    | temp_mm_srf             | 地表温度         | K             |
| 2    | temp_mm_1_5m            | 近地面气温       | K             |
| 3    | precip_mm_srf           | 总降水           | mm/day        |
| 4    | u_mm_10m                | 10m 纬向风       | m/s           |
| 5    | v_mm_10m                | 10m 经向风       | m/s           |
| 6    | p_mm_msl                | 海平面气压       | hPa           |
| 7    | totCloud_mm_ua          | 总云量           | fraction      |
| 8    | sm_mm_soil              | 土壤湿度         | kg/m²         |
| 9    | transpiration_mm_srf    | 植被蒸腾         | kg/m²/s       |
| 10   | soilEvap_mm_srf         | 土壤蒸发         | kg/m²/s       |
| 11   | canopyEvap_mm_can       | 冠层蒸发         | kg/m²/s       |
| 12   | solar_mm_s3_srf         | 地表净短波辐射   | W/m²          |
| 13   | longwave_mm_s3_srf      | 地表净长波辐射   | W/m²          |
| 14   | sh_mm_hyb               | 感热通量         | W/m²          |
| 15   | lh_mm_srf               | 潜热通量         | W/m²          |
| 16   | iceconc_mm_srf          | 海冰覆盖率       | fraction      |
| 17   | icedepth_mm_srf         | 海冰厚度         | m             |
| 18   | snowdepth_mm_srf        | 积雪深度         | m             |
| 19   | srfRunoff_mm_srf        | 地表径流         | kg/m²/s       |
| 20   | subsrfRunoff_mm_srf     | 地下径流         | kg/m²/s       |

---

## 2. 技术选型

### 2.1 前端

| 技术               | 用途                        | 选型理由                              |
|--------------------|-----------------------------|---------------------------------------|
| React 18           | UI 框架                     | 生态丰富、社区活跃、SSR 支持           |
| TypeScript         | 类型安全                    | 大型项目必备、减少运行时错误           |
| Vite               | 构建工具                    | 极快的 HMR、ESBuild 打包               |
| MapLibre GL JS     | 地图渲染引擎                | 开源、WebGL 高性能、支持自定义栅格图层 |
| Deck.gl            | 科学数据可视化叠加层        | 专为大规模地理数据设计、GPU 加速       |
| Ant Design / Shadcn| UI 组件库                   | 开箱即用的中文友好组件                 |
| Zustand            | 状态管理                    | 轻量、TS 友好、比 Redux 简洁           |
| React Query        | 服务端状态 / 缓存           | 自动缓存、请求去重、乐观更新           |
| ECharts            | 统计图表（时间序列）        | 国产、功能全面、地理坐标系支持         |

### 2.2 后端

| 技术               | 用途                        | 选型理由                              |
|--------------------|-----------------------------|---------------------------------------|
| Python 3.11+       | 主语言                      | 科学计算生态（xarray/numpy/pandas）    |
| FastAPI            | Web 框架                    | 高性能异步、自动 OpenAPI 文档          |
| xarray + netCDF4   | NC 文件读写                 | 地球科学标准工具栈                     |
| Dask               | 并行计算                    | 大规模 NC 数据惰性求值                 |
| Celery + Redis     | 异步任务队列                | NC 生成可能耗时，需异步处理            |
| Pydantic           | 数据校验                    | FastAPI 原生集成                       |
| Uvicorn + Gunicorn | ASGI 服务器                 | 生产级并发                             |
| rioxarray          | 地理栅格处理                | 投影转换、重采样                       |
| cartopy / matplotlib| 服务端渲染静态图（降级方案）| 成熟的科学制图库                      |

### 2.3 基础设施

| 技术               | 用途                        |
|--------------------|-----------------------------|
| PostgreSQL 15      | 元数据 & 任务管理             |
| PostGIS            | 空间索引 & 地理查询           |
| Redis              | 缓存 & 消息队列               |
| MinIO (开发)       | 本地对象存储模拟              |
| Docker + Compose   | 本地开发 & 生产容器化         |
| Nginx              | 反向代理 & 静态资源           |
| GitHub Actions     | CI/CD                        |

---

## 3. 系统架构

### 3.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           用户浏览器 (Browser)                           │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  React SPA                                                         │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────────┐  │ │
│  │  │时间轴选择 │ │属性切换  │ │地图渲染  │ │ NC下载 / 图表面板    │  │ │
│  │  │(Geologic │ │(Variable │ │(MapLibre │ │ (Download & Charts)  │  │ │
│  │  │ Timeline)│ │ Selector)│ │ +Deck.gl)│ │                      │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTPS / WSS
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Nginx (反向代理 + 静态资源)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐  │
│  │ /api/*       │  │ /ws/*        │  │ /static/*  (前端静态文件)     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────────────┘  │
└─────────┼─────────────────┼─────────────────────────────────────────────┘
          │                 │
          ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    FastAPI 应用层 (Uvicorn + Gunicorn)                    │
│  ┌───────────────┐ ┌───────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │ REST API      │ │ WebSocket     │ │ 认证中间件    │ │ 日志中间件    │ │
│  │ /api/v1/*     │ │ /ws/task/*    │ │ (JWT)        │ │ (Structlog)  │ │
│  └───────┬───────┘ └───────┬───────┘ └──────────────┘ └──────────────┘ │
│          │                 │                                            │
│  ┌───────┴─────────────────┴──────────────────────────────────────────┐ │
│  │                       服务层 (Service Layer)                        │ │
│  │  ┌──────────────┐ ┌────────────────┐ ┌────────────────────────┐   │ │
│  │  │ TimeService  │ │ VariableService│ │ NCGenerationService    │   │ │
│  │  │ 时间→NC映射  │ │ 属性元数据管理 │ │ NC文件生成 / 切片      │   │ │
│  │  └──────────────┘ └────────────────┘ └────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└───────────────────────┬─────────────────────────────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
┌──────────────┐ ┌────────────┐ ┌──────────────────────┐
│ PostgreSQL   │ │   Redis    │ │ Celery Worker        │
│ + PostGIS    │ │            │ │ (NC 数据生成/变换)    │
│              │ │            │ │                      │
│ • 时间映射表 │ │ • 任务状态 │ │ • xarray 处理管线     │
│ • 变量元数据 │ │ • 热力缓存 │ │ • Dask 并行           │
│ • 用户/任务  │ │ • 限流计数 │ │ • NC→COG 切片转换     │
└──────────────┘ └────────────┘ └──────────┬───────────┘
                                           │
                                           ▼
                               ┌──────────────────────┐
                               │  阿里云 OSS           │
                               │  (对象存储)           │
                               │                      │
                               │ • 原始 NC 文件        │
                               │ • 生成的 Cloud-       │
                               │   Optimized GeoTIFF   │
                               │ • 静态瓦片            │
                               └──────────────────────┘
```

### 3.2 核心数据流

```
用户请求("430Ma, temp_mm_srf")
         │
         ▼
┌─────────────────────┐
│ 1. 参数校验          │  FastAPI Pydantic Schema 校验
│    (Pydantic)       │
└────────┬────────────┘
         ▼
┌─────────────────────┐
│ 2. 查询时间映射      │  PostgreSQL: time_mapping
│    TimeService      │  430Ma → file_group_id
└────────┬────────────┘
         ▼
┌─────────────────────┐
│ 3. 检查缓存          │  Redis: 存在则直接返回 CDN URL
│    CacheService     │
└────────┬────────────┘
         ▼ (miss)
┌─────────────────────┐
│ 4. 提交异步任务      │  Celery Task Queue
│    TaskService      │  → worker 处理 NC 切片
└────────┬────────────┘
         ▼
┌─────────────────────┐
│ 5. NC 处理管线       │  xarray + rioxarray:
│    Celery Worker    │  open_dataset → sel(var)
│                     │  → reproject(EPSG:4326)
│                     │  → to_geotiff (COG)
│                     │  → upload to OSS
└────────┬────────────┘
         ▼
┌─────────────────────┐
│ 6. 返回 Tile URL    │  WebSocket 推送完成通知
│    + 更新缓存        │  → 前端开始渲染
└─────────────────────┘
```

---

## 4. 前端架构

### 4.1 目录结构

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── api/                    # API 调用层
│   │   ├── client.ts           # Axios/Fetch 封装
│   │   ├── timeApi.ts          # 时间轴相关接口
│   │   ├── variableApi.ts      # 变量元数据接口
│   │   └── taskApi.ts          # 任务管理接口
│   ├── components/             # 通用组件
│   │   ├── Layout/             # 布局组件
│   │   ├── Timeline/           # 地质年代时间轴
│   │   ├── VariableSelector/   # 属性选择器
│   │   ├── MapViewer/          # 地图可视化核心
│   │   ├── DataPanel/          # 数据面板（图表）
│   │   └── DownloadPanel/      # 下载面板
│   ├── hooks/                  # 自定义 Hooks
│   │   ├── useTimeline.ts
│   │   ├── useClimateData.ts
│   │   └── useWebSocket.ts
│   ├── stores/                 # Zustand 状态
│   │   ├── appStore.ts
│   │   ├── mapStore.ts
│   │   └── taskStore.ts
│   ├── types/                  # TypeScript 类型定义
│   │   ├── climate.ts
│   │   ├── time.ts
│   │   └── api.ts
│   ├── utils/                  # 工具函数
│   │   ├── colorScale.ts       # 色阶映射
│   │   ├── ncParser.ts         # 前端 NC 解析（轻量场景）
│   │   └── projection.ts       # 投影工具
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts
└── Dockerfile
```

### 4.2 核心组件设计

#### 地图可视化核心 (MapViewer)

```
MapViewer
├── BaseMap (MapLibre GL)
│   ├── 海岸线 & 边界图层
│   ├── 古地理重建图层 (PaleoGIS 数据叠加)
│   └── 现代参照图层
├── ClimateOverlay (Deck.gl)
│   ├── BitmapLayer      ← COG (Cloud-Optimized GeoTIFF) 切片
│   ├── TileLayer        ← 预生成 PNG 瓦片 (降级方案)
│   └── ContourLayer     ← 等值线图层
├── ColorLegend          ← 色标图例
├── PointInspector       ← 点击查询点值
├── TimeSlider           ← 时间轴拖动
└── ExportButton         ← 导出当前视图
```

#### 地质年代时间轴 (Timeline)

```
Timeline
├── 代 (Era)    选择器: 古生代 / 中生代 / 新生代
├── 纪 (Period) 选择器: 寒武纪 / 奥陶纪 / ... / 第四纪
├── 世 (Epoch)  滑块: 精确到 Ma (百万年)
└── 预设快捷按钮: 关键地质事件节点
    ├── 寒武纪大爆发 (541 Ma)
    ├── 奥陶纪末大灭绝 (445 Ma)
    ├── 二叠纪-三叠纪大灭绝 (252 Ma)
    ├── 白垩纪-古近纪大灭绝 (66 Ma)
    └── ...
```

### 4.3 路由设计

| 路由                 | 页面           | 说明                       |
|----------------------|----------------|---------------------------|
| `/`                  | 主页 / 地图页   | 默认地图 + 时间轴          |
| `/compare`           | 对比模式        | 双时间点/双属性并排对比     |
| `/timeseries`        | 时间序列        | 单点/区域的时间序列图表     |
| `/download`          | 下载中心        | NC 文件下载管理             |
| `/docs`              | 文档页          | 使用说明 & 数据说明         |

---

## 5. 后端架构

### 5.1 目录结构

```
backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── time.py            # 时间查询接口
│   │   │   ├── variable.py        # 变量元数据接口
│   │   │   ├── generate.py        # NC 生成 / 切片接口
│   │   │   ├── download.py        # 下载接口
│   │   │   └── task.py            # 任务状态查询接口
│   │   └── deps.py                # 公共依赖 (Auth / DB Session)
│   ├── core/
│   │   ├── config.py              # 配置管理 (pydantic-settings)
│   │   ├── security.py            # JWT 认证
│   │   └── exceptions.py          # 自定义异常
│   ├── models/
│   │   ├── base.py                # SQLAlchemy Base
│   │   ├── time_mapping.py        # 时间→文件映射模型
│   │   ├── variable_meta.py       # 变量元数据模型
│   │   └── task.py                # 异步任务模型
│   ├── schemas/
│   │   ├── time.py                # Pydantic 请求/响应 Schema
│   │   ├── variable.py
│   │   └── task.py
│   ├── services/
│   │   ├── time_service.py        # 时间查询业务逻辑
│   │   ├── variable_service.py    # 变量管理
│   │   ├── nc_service.py          # NC 文件处理
│   │   ├── tile_service.py        # 瓦片生成
│   │   └── export_service.py      # 文件导出
│   ├── tasks/
│   │   ├── celery_app.py          # Celery 配置
│   │   ├── nc_tasks.py            # NC 处理 Celery 任务
│   │   └── export_tasks.py        # 导出 Celery 任务
│   └── main.py                    # FastAPI 应用入口
├── alembic/                        # 数据库迁移
├── tests/
├── Dockerfile
├── requirements.txt
└── pyproject.toml
```

### 5.2 中间件栈

```
Request
  │
  ├── CORSMiddleware          # 跨域处理
  ├── TrustedHostMiddleware   # 主机白名单
  ├── GZipMiddleware          # 响应压缩
  ├── RequestLoggingMiddleware # 结构化日志
  ├── RateLimitMiddleware      # 限流 (基于 Redis)
  └── AuthMiddleware           # JWT 认证 (可选 / 内部接口)
  │
  ▼
Route Handler
```

---

## 6. 数据处理管线

### 6.1 NC 文件处理流程

```
原始 NC 文件 (OSS / 本地挂载)
       │
       ▼
┌─────────────────────┐
│ Step 1: 索引建立     │  扫描 OSS → 解析 NC 元数据 → 写入 PostgreSQL time_mapping
│ (离线 / 管理员触发)  │  • 时间范围 (Ma)
│                     │  • 可用变量列表
│                     │  • 空间分辨率
│                     │  • 网格类型 (经纬度 / 立方球)
└────────┬────────────┘
         ▼
┌─────────────────────┐
│ Step 2: 用户请求     │  GET /api/v1/generate?time=430&var=temp_mm_srf
│ (实时)              │
└────────┬────────────┘
         ▼
┌─────────────────────┐
│ Step 3: 变量提取     │  xarray.open_dataset(nc_path)[variable_name]
│ (xarray)            │  → 提取单变量 2D/3D DataArray
│                     │  → 时间维度切片 (取均值/特定月份)
└────────┬────────────┘
         ▼
┌─────────────────────┐
│ Step 4: 投影变换     │  rioxarray.reproject("EPSG:4326")
│ (rioxarray)         │  → 统一经纬度等距投影
└────────┬────────────┘
         ▼
┌─────────────────────┐
│ Step 5: 瓦片生成     │  方案 A (推荐): COG (Cloud-Optimized GeoTIFF)
│ (gdal / rio-cogeo)  │    → 前端 Deck.gl BitmapLayer 直接读取
│                     │  方案 B: XYZ 瓦片金字塔
│                     │    → gdal2tiles → PNG 瓦片 → OSS
│                     │  方案 C: 服务端渲染
│                     │    → matplotlib+cartopy → PNG → 前端
└────────┬────────────┘
         ▼
┌─────────────────────┐
│ Step 6: 上传 & 缓存  │  COG / PNG → 阿里云 OSS
│                     │  URL → Redis (key: time:var, value: OSS URL)
└────────┬────────────┘
         ▼
      返回给前端
```

### 6.2 性能优化策略

| 策略                | 说明                                        |
|---------------------|---------------------------------------------|
| COG 格式            | Cloud-Optimized GeoTIFF，前端可按需读取局部   |
| 预生成常用组合       | 高频访问的时间+变量组合离线预切片              |
| Dask 并行           | 多 NC 文件并行处理，利用多核 CPU              |
| Redis 缓存          | 热点请求 OSS URL 缓存，TTL = 7 天             |
| CDN 加速            | 阿里云 CDN 回源 OSS，加速瓦片分发              |
| 渐进式加载           | 先加载低分辨率概览，用户缩放时加载高分辨率      |

---

## 7. 数据库设计

### 7.1 核心表结构

#### time_mapping（时间映射表）

| 列名            | 类型         | 说明                         |
|-----------------|--------------|------------------------------|
| id              | SERIAL PK    | 主键                         |
| geologic_age_ma | DECIMAL(7,2) | 地质年代（百万年）            |
| period_name     | VARCHAR(64)  | 纪名称 (如 "Ordovician")     |
| era_name        | VARCHAR(64)  | 代名称 (如 "Paleozoic")      |
| file_group_id   | VARCHAR(128) | 文件组标识                   |
| oss_bucket      | VARCHAR(128) | OSS Bucket 名称              |
| oss_prefix      | VARCHAR(256) | OSS 路径前缀                 |
| resolution      | VARCHAR(32)  | 空间分辨率 (如 "1deg")       |
| grid_type       | VARCHAR(32)  | 网格类型 (如 "latlon")       |
| created_at      | TIMESTAMPTZ  | 创建时间                     |
| updated_at      | TIMESTAMPTZ  | 更新时间                     |

#### variable_meta（变量元数据表）

| 列名            | 类型         | 说明                         |
|-----------------|--------------|------------------------------|
| id              | SERIAL PK    | 主键                         |
| var_name        | VARCHAR(64)  | 变量名 (如 temp_mm_srf)      |
| var_category    | VARCHAR(64)  | 变量类别 (temperature / ...) |
| display_name_zh | VARCHAR(128) | 中文显示名                    |
| units           | VARCHAR(32)  | 单位                         |
| colormap        | VARCHAR(64)  | 默认色阶 (如 "RdYlBu_r")     |
| value_range_min | FLOAT        | 建议值域最小值                |
| value_range_max | FLOAT        | 建议值域最大值                |
| is_3d           | BOOLEAN      | 是否为 3D 变量（含垂直层）    |

#### task（任务表）

| 列名            | 类型         | 说明                         |
|-----------------|--------------|------------------------------|
| id              | UUID PK      | 任务 ID                      |
| task_type       | VARCHAR(32)  | generate / export / reindex  |
| params          | JSONB        | 任务参数                     |
| status          | VARCHAR(16)  | pending / running / done / fail |
| progress        | SMALLINT     | 进度 0-100                   |
| result_url      | VARCHAR(512) | 结果 OSS URL                 |
| error_message   | TEXT         | 错误信息                     |
| created_at      | TIMESTAMPTZ  | 创建时间                     |
| updated_at      | TIMESTAMPTZ  | 更新时间                     |

#### tile_cache（瓦片缓存索引表）

| 列名            | 类型         | 说明                         |
|-----------------|--------------|------------------------------|
| id              | BIGSERIAL PK | 主键                         |
| geologic_age_ma | DECIMAL(7,2) | 地质年代                     |
| var_name        | VARCHAR(64)  | 变量名                       |
| z               | SMALLINT     | 缩放层级                     |
| x               | INT          | 瓦片 X 坐标                  |
| y               | INT          | 瓦片 Y 坐标                  |
| oss_url         | VARCHAR(512) | OSS 完整 URL                 |
| created_at      | TIMESTAMPTZ  | 创建时间                     |

---

## 8. 接口设计摘要

> 完整接口文档见 `API_DOCUMENTATION.csv` 文件，此处列出接口分组概览。

### 8.1 REST API 分组

| 分组          | 前缀                       | 说明                       |
|---------------|----------------------------|---------------------------|
| 时间查询      | `/api/v1/time/*`           | 地质年代→数据映射查询       |
| 变量管理      | `/api/v1/variable/*`       | 气候变量元数据 CRUD         |
| 数据生成      | `/api/v1/generate/*`       | 触发 NC 切片生成任务        |
| 瓦片服务      | `/api/v1/tiles/*`          | 地图瓦片获取               |
| 下载          | `/api/v1/download/*`       | NC 文件打包下载             |
| 任务状态      | `/api/v1/task/*`           | 异步任务进度查询 / WebSocket|
| 管理          | `/api/v1/admin/*`          | 数据索引管理（管理员）       |

### 8.2 WebSocket 端点

| 端点               | 说明                    |
|--------------------|-------------------------|
| `/ws/task/{task_id}` | 实时推送任务进度与结果  |

---

## 9. 阿里云部署方案

### 9.1 阿里云产品清单

| 产品                    | 用途                         | 规格建议 (起步)          |
|-------------------------|------------------------------|--------------------------|
| **ECS**                 | 应用服务器 (FastAPI)          | ecs.c7.xlarge (4C8G) ×2  |
| **ACK** (或 ECS 自管)   | 容器编排 (可选)               | 2 Node, 4C8G             |
| **OSS**                 | NC 文件 & 瓦片存储            | 标准存储 + CDN 回源       |
| **CDN / DCDN**          | 瓦片全球加速分发              | 按流量计费                |
| **RDS PostgreSQL**      | 元数据库                     | pg.n2.medium (2C4G)      |
| **Redis**               | 缓存 & 消息队列               | 标准版 2GB               |
| **NAS**                 | 共享文件存储 (Celery Worker)  | 通用型 SSD                |
| **SLB**                 | 负载均衡                     | 公网 SLB                 |
| **WAF**                 | Web 应用防火墙                | 基础版                   |
| **日志服务 SLS**         | 日志收集与分析                | 按量计费                  |
| **云监控**               | 基础监控 & 告警               | 免费版起                  |

### 9.2 部署拓扑

```
                         Internet
                            │
                            ▼
              ┌────────────────────────┐
              │  阿里云 WAF + CDN/DCDN  │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  SLB (公网负载均衡)      │
              │  监听: 80, 443          │
              └────────┬───────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │ ECS-1    │ │ ECS-2    │ │ ECS-3    │
    │ Nginx    │ │ Nginx    │ │ Celery   │
    │ FastAPI  │ │ FastAPI  │ │ Worker   │
    │ (Web)    │ │ (Web)    │ │ (Worker) │
    └────┬─────┘ └────┬─────┘ └────┬─────┘
         │            │            │
         └────────────┼────────────┘
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
    ┌─────────┐ ┌──────────┐ ┌──────────┐
    │ RDS PG  │ │  Redis   │ │   NAS    │
    │(元数据) │ │(缓存/队列)│ │ (共享存储)│
    └─────────┘ └──────────┘ └────┬─────┘
                                  │
                                  ▼
                         ┌──────────────┐
                         │  OSS + CDN   │
                         │ (NC / 瓦片)  │
                         └──────────────┘
```

### 9.3 Docker Compose 生产配置示例

```yaml
# docker-compose.prod.yml
version: "3.9"
services:
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - frontend_dist:/usr/share/nginx/html
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend

  backend:
    image: registry.cn-hangzhou.aliyuncs.com/paleoearth/backend:latest
    env_file: .env.production
    command: gunicorn -k uvicorn.workers.UvicornWorker -w 4 app.main:app
    depends_on:
      - redis
      - postgres

  celery_worker:
    image: registry.cn-hangzhou.aliyuncs.com/paleoearth/backend:latest
    command: celery -A app.tasks.celery_app worker -l info -c 4
    env_file: .env.production
    depends_on:
      - redis
      - postgres
    volumes:
      - nas_shared:/data

  celery_beat:
    image: registry.cn-hangzhou.aliyuncs.com/paleoearth/backend:latest
    command: celery -A app.tasks.celery_app beat -l info
    env_file: .env.production
    depends_on:
      - redis
      - postgres

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  postgres:
    image: postgis/postgis:15-3.4
    env_file: .env.production
    volumes:
      - pg_data:/var/lib/postgresql/data

volumes:
  frontend_dist:
  redis_data:
  pg_data:
  nas_shared:
    driver: local
    driver_opts:
      type: nfs
      o: addr=<NAS_IP>,vers=4.0
      device: ":<NAS_PATH>"
```

### 9.4 部署步骤

#### 第一阶段：基础设施准备

```bash
# 1. 创建 VPC 网络
aliyun vpc CreateVpc --vpc-name paleoearth-vpc --cidr-block 10.0.0.0/16

# 2. 创建交换机
aliyun vpc CreateVSwitch --v-switch-name paleoearth-switch \
  --vpc-id <vpc-id> --cidr-block 10.0.1.0/24 --zone-id cn-hangzhou-g

# 3. 创建安全组 (开放 80/443/22)
aliyun ecs CreateSecurityGroup --security-group-name paleoearth-sg --vpc-id <vpc-id>

# 4. 创建 ECS 实例 (3 台)
# 使用阿里云控制台或 CLI 创建，选择 CentOS 7.9 / Alibaba Cloud Linux 3

# 5. 创建 RDS PostgreSQL
# 控制台 → 数据库 → RDS → 创建实例 → PostgreSQL 15 + PostGIS

# 6. 创建 Redis
# 控制台 → 数据库 → Redis → 创建实例

# 7. 创建 OSS Bucket
aliyun oss mb oss://paleoearth-nc-data --region cn-hangzhou
aliyun oss mb oss://paleoearth-tiles --region cn-hangzhou
```

#### 第二阶段：应用部署

```bash
# 1. 登录阿里云容器镜像服务
docker login --username=<username> registry.cn-hangzhou.aliyuncs.com

# 2. 构建 & 推送镜像
docker build -t registry.cn-hangzhou.aliyuncs.com/paleoearth/backend:latest ./backend
docker push registry.cn-hangzhou.aliyuncs.com/paleoearth/backend:latest

docker build -t registry.cn-hangzhou.aliyuncs.com/paleoearth/frontend:latest ./frontend
docker push registry.cn-hangzhou.aliyuncs.com/paleoearth/frontend:latest

# 3. 通过 ACK 或 docker-compose 部署
scp docker-compose.prod.yml root@<ecs-ip>:/opt/paleoearth/
ssh root@<ecs-ip> "cd /opt/paleoearth && docker compose -f docker-compose.prod.yml up -d"

# 4. 配置 CDN 加速 (OSS 回源)
# 控制台 → CDN → 添加域名 → 源站: paleoearth-tiles.oss-cn-hangzhou.aliyuncs.com

# 5. 配置 SLB + 域名解析
# 将域名 A 记录指向 SLB 公网 IP
```

#### 第三阶段：数据初始化

```bash
# 1. 上传已有 NC 文件到 OSS
aliyun oss cp -r ./data/ oss://paleoearth-nc-data/nc-files/ --recursive

# 2. 运行数据索引脚本
ssh root@<ecs-ip> "docker exec paleoearth_backend_1 python -m app.scripts.index_nc_files"

# 3. 预生成常用瓦片 (可选)
ssh root@<ecs-ip> "docker exec paleoearth_celery_worker_1 \
  python -m app.scripts.pre_generate_tiles --ages 0,50,100,200,300,400,500"
```

---

## 10. 开发环境搭建

### 10.1 前置条件

- Python 3.11+
- Node.js 20+
- Docker & Docker Compose
- Git

### 10.2 快速启动

```bash
# 1. 克隆仓库
git clone <repo-url> paleoearth
cd paleoearth

# 2. 启动开发环境
docker compose up -d    # 启动 PostgreSQL + Redis + MinIO

# 3. 启动后端
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# 4. 启动前端
cd frontend
npm install
cp .env.example .env
npm run dev

# 5. 访问
# 前端: http://localhost:5173
# 后端 API 文档: http://localhost:8000/docs
# MinIO Console: http://localhost:9001
```

### 10.3 开发环境 docker-compose

```yaml
# docker-compose.yml (开发环境)
version: "3.9"
services:
  postgres:
    image: postgis/postgis:15-3.4
    environment:
      POSTGRES_USER: paleoearth
      POSTGRES_PASSWORD: devpass
      POSTGRES_DB: paleoearth_dev
    ports:
      - "5432:5432"
    volumes:
      - pg_dev:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_dev:/data

volumes:
  pg_dev:
  minio_dev:
```

---

## 11. CI/CD 流水线

### 11.1 GitHub Actions 工作流

```yaml
# .github/workflows/deploy.yml
name: Build & Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.11" }
      - run: pip install -r backend/requirements.txt
      - run: cd backend && pytest --cov=app tests/

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - run: cd frontend && npm ci && npm run test && npm run build

  build-and-push:
    needs: [test-backend, test-frontend]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Login ACR
        uses: aliyun/acr-login@v1
        with:
          registry: registry.cn-hangzhou.aliyuncs.com
          access-key-id: ${{ secrets.ALIYUN_ACCESS_KEY_ID }}
          access-key-secret: ${{ secrets.ALIYUN_ACCESS_KEY_SECRET }}
      - name: Build & Push Backend
        run: |
          docker build -t registry.cn-hangzhou.aliyuncs.com/paleoearth/backend:${{ github.sha }} ./backend
          docker push registry.cn-hangzhou.aliyuncs.com/paleoearth/backend:${{ github.sha }}
      - name: Build & Push Frontend
        run: |
          docker build -t registry.cn-hangzhou.aliyuncs.com/paleoearth/frontend:${{ github.sha }} ./frontend
          docker push registry.cn-hangzhou.aliyuncs.com/paleoearth/frontend:${{ github.sha }}

  deploy:
    needs: [build-and-push]
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to ECS
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.ECS_HOST }}
          username: root
          key: ${{ secrets.ECS_SSH_KEY }}
          script: |
            cd /opt/paleoearth
            docker compose -f docker-compose.prod.yml pull
            docker compose -f docker-compose.prod.yml up -d --remove-orphans
```

---

## 12. 监控与运维

### 12.1 监控体系

| 层级        | 工具               | 监控内容                           |
|-------------|--------------------|------------------------------------|
| 基础设施    | 阿里云云监控        | CPU、内存、磁盘、网络              |
| 应用性能    | Sentry / 自建       | 异常追踪、性能瓶颈                  |
| 日志        | 阿里云 SLS          | 集中日志、关键词告警                |
| 业务指标    | Prometheus + Grafana| API 延迟、任务队列长度、缓存命中率  |
| 可用性      | 阿里云云拨测        | HTTP 探测、响应时间告警             |

### 12.2 关键告警规则

| 告警场景                  | 条件                         | 通知方式    |
|---------------------------|------------------------------|------------|
| API 5xx 错误率过高        | 5xx > 5% 持续 5 分钟         | 钉钉 / 邮件 |
| Celery 任务积压           | 队列长度 > 100 持续 10 分钟  | 钉钉        |
| ECS CPU > 90%             | 持续 15 分钟                 | 短信 + 钉钉 |
| OSS 请求异常              | 错误率突增                   | 钉钉        |
| RDS 连接数接近上限        | > 80% 最大连接数             | 钉钉        |

### 12.3 备份策略

| 数据          | 备份方式                | 频率         | 保留期  |
|---------------|-------------------------|--------------|---------|
| PostgreSQL    | RDS 自动备份            | 每日         | 30 天   |
| OSS NC 文件   | 跨区域复制 (CRR)        | 实时         | 永久    |
| Redis         | RDB 快照                | 每日         | 7 天    |
| 应用日志      | SLS 存储               | 实时         | 90 天   |

---

## 13. 安全设计

### 13.1 安全层次

```
┌─────────────────────────┐
│ WAF (SQL注入/XSS/CC防护) │
├─────────────────────────┤
│ CDN (DDoS 基础防护)      │
├─────────────────────────┤
│ SLB + HTTPS (TLS 1.3)   │
├─────────────────────────┤
│ Nginx (限流/IP白名单)     │
├─────────────────────────┤
│ JWT 认证 (API 鉴权)      │
├─────────────────────────┤
│ 参数校验 (Pydantic)       │
├─────────────────────────┤
│ 数据库加密 (RDS TDE)      │
└─────────────────────────┘
```

### 13.2 安全措施清单

- **传输加密**：全站 HTTPS，TLS 1.3
- **API 鉴权**：JWT Token + Refresh Token 机制
- **OSS 安全**：私有 Bucket + STS 临时授权 + 防盗链 Referer 白名单
- **数据库**：使用 RDS 专有网络，不暴露公网端口
- **密钥管理**：阿里云 KMS 管理数据库密码、API 密钥等
- **依赖扫描**：CI 中集成 `pip-audit` / `npm audit`
- **容器安全**：使用非 root 用户运行、镜像漏洞扫描（ACR 内置）
- **限流**：Redis 滑动窗口限流，API 级别 QPS 控制

---

## 14. 项目路线图

### Phase 1 — MVP（2-3 个月）

- [x] 项目初始化、技术选型确认
- [ ] 后端基础框架 (FastAPI + DB + Redis + Celery)
- [ ] 时间映射 API + 变量管理 API
- [ ] 单变量 NC 切片生成 + COG 转换
- [ ] 前端地图基础渲染 (MapLibre + Deck.gl BitmapLayer)
- [ ] 时间轴组件 + 变量选择器
- [ ] 阿里云基础设施搭建 + 部署

### Phase 2 — 功能增强（2-3 个月）

- [ ] 多变量对比模式
- [ ] 时间序列动画回放
- [ ] 点选查询（点击地图获取该点精确值）
- [ ] 截面图（经度/纬度剖面）
- [ ] NC 文件在线下载（支持裁剪区域）
- [ ] 用户系统（可选）

### Phase 3 — 扩展（长期）

- [ ] 多模型对比（不同气候模型结果并排对比）
- [ ] 深度学习降尺度
- [ ] 古地理重建图层叠加（板块构造、海岸线变化）
- [ ] REST API 对外开放（API Key 管理 + 计量计费）
- [ ] 移动端适配

---

## 附录

### A. 环境变量清单 (.env.example)

```ini
# ===== 应用 =====
APP_NAME=PaleoEarth
APP_VERSION=1.0.0
DEBUG=false
SECRET_KEY=<random-64-char-string>

# ===== 数据库 =====
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/paleoearth
DATABASE_URL_SYNC=postgresql://user:pass@host:5432/paleoearth

# ===== Redis =====
REDIS_URL=redis://:password@host:6379/0
CELERY_BROKER_URL=redis://:password@host:6379/1
CELERY_RESULT_BACKEND=redis://:password@host:6379/2

# ===== 阿里云 OSS =====
OSS_ACCESS_KEY_ID=<your-access-key>
OSS_ACCESS_KEY_SECRET=<your-secret>
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
OSS_NC_BUCKET=paleoearth-nc-data
OSS_TILE_BUCKET=paleoearth-tiles

# ===== CDN =====
CDN_DOMAIN=https://cdn.paleoearth.example.com

# ===== JWT =====
JWT_SECRET_KEY=<random-secret>
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

# ===== CORS =====
CORS_ORIGINS=https://paleoearth.example.com,https://localhost:5173
```

### B. 参考资料

- [CF Conventions (Climate & Forecast Metadata)](https://cfconventions.org/)
- [Cloud-Optimized GeoTIFF (COG) Specification](https://www.cogeo.org/)
- [MapLibre GL JS Documentation](https://maplibre.org/maplibre-gl-js/docs/)
- [Deck.gl Geo Layers](https://deck.gl/docs/api-reference/geo-layers/overview)
- [阿里云 ECS 部署最佳实践](https://help.aliyun.com/document_detail/ecs-best-practices.html)
- [阿里云 OSS + CDN 静态网站托管](https://help.aliyun.com/document_detail/oss-cdn.html)
- [xarray Documentation](https://docs.xarray.dev/)
