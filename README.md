# DeepEarth — 古气候可视化系统

> 通过 Web 工具可视化古地球全球气候剖面数据，直观展示不同地质年代的气候属性。

## 项目简介

DeepEarth 提供古气候数据的交互式可视化，覆盖 **430–505 Ma**（百万年前）的古生代气候模拟数据，包括寒武纪、奥陶纪和志留纪。

| 属性 | 值 |
|------|-----|
| 数据来源 | UK Met Office Unified Model (v4.5/4.6) |
| 数据格式 | NetCDF3 Classic |
| 空间网格 | 96 × 73 全球经纬度 (3.75° × 2.5°) |
| 地质年代 | 16 个时间切片 (430–505 Ma) |
| 气候变量 | 38+ (温度、降水、风场、气压、辐射、海冰、积雪…) |
| 配色 | 暗色科技风 (Dark Scientific / Cyberpunk) |

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + Ant Design |
| 地图 | 静态覆盖图 (matplotlib+cartopy 服务端渲染) |
| 后端 | FastAPI + SQLAlchemy + aiosqlite |
| 数据处理 | xarray + scipy + numpy |
| 字体 | Fira Code + Fira Sans (Google Fonts) |

## 快速启动

```bash
# 后端
cd backend
pip install -r requirements.txt
python -m app.scripts.index_data
uvicorn app.main:app --reload --port 8000

# 前端
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

## API

完整文档见 [API_DOCUMENTATION.csv](API_DOCUMENTATION.csv) 及 http://localhost:8000/api/docs

## 部署

- [CLOUDFLARE_DEPLOY.md](CLOUDFLARE_DEPLOY.md) — Cloudflare 免费部署
- [DEPLOYMENT.md](DEPLOYMENT.md) — 阿里云/自建服务器部署
- 在线地址: `http://121.43.102.66`

## 版本

**v1.0.0** — Phase 1 MVP

- ✅ 地质年代时间轴 (16 时间切片)
- ✅ 38+ 气候变量
- ✅ 全球气候覆盖图 (matplotlib+cartopy)
- ✅ 点查询 (双线性插值) + 区域统计 + 时间序列
- ✅ 暗色科技风 UI (DeepEarth)
- ✅ 阿里云 ECS 生产部署
