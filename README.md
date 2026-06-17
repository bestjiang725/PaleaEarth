# 古地球气候剖面可视化系统 — PaleoEarth Visualizer

> 通过 Web 工具可视化古地球全球气候剖面数据，直观展示不同地质年代的气候属性。

## 项目简介

本系统提供古气候数据的交互式可视化，覆盖 **430-505 Ma**（百万年前）的古生代气候模拟数据，包括寒武纪、奥陶纪和志留纪。

数据来源：UK Met Office Unified Model (v4.5/4.6) 古气候模拟输出  
数据格式：NetCDF3，96×73 全球经纬度网格（3.75° × 2.5°）  
气候变量：38+ 个（温度、降水、风场、气压、云量、辐射、通量、海冰、积雪、径流等）

## 技术栈

| 层级     | 技术                                              |
| -------- | ------------------------------------------------- |
| 前端     | React 18 + TypeScript + Vite + Ant Design         |
| 地图     | 静态覆盖图 (matplotlib+cartopy 服务端渲染)         |
| 后端     | FastAPI (Python) + SQLAlchemy + aiosqlite         |
| 数据处理 | xarray + scipy + numpy                            |
| 可视化   | matplotlib + cartopy (PlateCarree 等距矩形投影)    |

## 快速启动

### 前置条件

- Python 3.13+
- Node.js 20+
- Git Bash (Windows) 或 WSL

### 1. 启动后端

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 索引数据（首次运行必需）
python -m app.scripts.index_data

# 启动 API 服务
uvicorn app.main:app --reload --port 8000
```

访问 API 文档：http://localhost:8000/api/docs

### 2. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问前端页面：http://localhost:5173

## 使用指南

1. **选择地质年代**：在左侧面板通过纪选择器（寒武纪/奥陶纪/志留纪）或滑动条选择精确年代（如 430 Ma）
2. **选择气候变量**：在变量面板展开类别，点击变量名称（如 temp_mm_srf 地表温度）
3. **查看地图**：系统自动生成并显示气候数据覆盖图，可使用透明度滑块调节
4. **点击查询**：点击地图上任意位置查看该点的精确气候值
5. **时间序列**：在底部数据面板查看不同地点（北京、赤道等）的气候时间序列

## API 端点概览

| 分组     | 路径                       | 说明                |
| -------- | -------------------------- | ------------------- |
| 时间查询 | GET /api/v1/time/ages      | 可用地质年代列表    |
| 时间查询 | GET /api/v1/time/timeline  | 地质年代表结构      |
| 变量管理 | GET /api/v1/variable/list  | 气候变量元数据      |
| 数据查询 | GET /api/v1/query/point    | 单点气候值查询      |
| 数据查询 | GET /api/v1/query/region   | 区域气候统计        |
| 数据查询 | GET /api/v1/query/timeseries | 时间序列查询      |
| 覆盖图   | GET /api/v1/tiles/overlay/{age}/{var}.png | 气候覆盖图 |
| 任务管理 | GET /api/v1/task/{id}/status | 任务状态查询      |

完整 API 文档见 [API_DOCUMENTATION.csv](API_DOCUMENTATION.csv)

## 项目结构

```
├── backend/
│   ├── app/
│   │   ├── api/v1/          # API 路由 (time, variable, query, generate, tiles, task, admin)
│   │   ├── core/             # 配置、数据库、异常处理
│   │   ├── models/           # SQLAlchemy 数据模型
│   │   ├── schemas/          # Pydantic 请求/响应模式
│   │   ├── services/         # 业务逻辑 (nc_service, tile_service, time_service, etc.)
│   │   ├── scripts/          # 数据索引脚本
│   │   └── utils/            # 工具函数 (文件发现、地理处理)
│   ├── storage/overlays/     # 生成的气候覆盖图 PNG
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/              # API 调用模块
│   │   ├── components/       # React 组件
│   │   │   ├── Layout/       # 布局 (Header, Sidebar)
│   │   │   ├── Timeline/     # 地质年代时间轴
│   │   │   ├── VariableSelector/ # 变量选择器
│   │   │   ├── MapViewer/    # 地图可视化
│   │   │   ├── DataPanel/    # 数据面板
│   │   │   └── DownloadPanel/ # 任务/下载管理
│   │   ├── hooks/            # 自定义 Hooks (React Query)
│   │   ├── pages/            # 页面组件
│   │   ├── stores/           # Zustand 状态管理
│   │   ├── types/            # TypeScript 类型
│   │   └── utils/            # 工具函数
│   └── vite.config.ts
├── data/                     # NC 气候数据文件 (16个地质年代)
├── ARCHITECTURE.md           # 系统架构文档
└── API_DOCUMENTATION.csv     # API 完整规范
```

## 版本

**v1.0.0** — Phase 1 MVP

- ✅ 地质年代时间轴（16个时间切片，430-505 Ma）
- ✅ 38+ 气候变量元数据管理
- ✅ 全球地图气候数据覆盖图（matplotlib+cartopy 渲染）
- ✅ 单点气候值查询（双线性插值）
- ✅ 区域气候统计分析
- ✅ 时间序列数据查询
- ✅ 覆盖图缓存与异步生成

### Phase 2 计划

- 🔲 MapLibre GL + Deck.gl 动态地图渲染
- 🔲 多变量/多时间点对比模式
- 🔲 时间序列动画回放
- 🔲 NC 文件在线下载
- 🔲 XYZ 瓦片金字塔（支持高缩放级别）
- 🔲 PostgreSQL + PostGIS 数据库
- 🔲 Redis + Celery 异步任务队列
- 🔲 阿里云 OSS + CDN 部署
