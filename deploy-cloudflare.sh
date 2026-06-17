#!/bin/bash
# ============================================================
# PaleoEarth — Cloudflare 一键部署脚本
# 用法: bash deploy-cloudflare.sh [tunnel-url]
# ============================================================
set -e

echo "🚀 PaleoEarth Cloudflare 部署"
echo "============================="

# ─── 1. 构建前端 ───
echo ""
echo "📦 [1/3] 构建前端..."
cd frontend

# 如果提供了 Tunnel URL，使用它作为 API 地址
if [ -n "$1" ]; then
  export VITE_API_BASE_URL="$1"
  echo "   API 后端: $VITE_API_BASE_URL"
else
  export VITE_API_BASE_URL=""
  echo "   API 后端: 同域代理（开发模式）"
fi

npm run build
echo "   ✅ 前端构建完成"

# ─── 2. 部署到 Cloudflare Pages ───
echo ""
echo "☁️  [2/3] 部署到 Cloudflare Pages..."
npx wrangler pages deploy dist --project-name=paleoearth
echo "   ✅ Pages 部署完成"

# ─── 3. 检查后端状态 ───
echo ""
echo "🔍 [3/3] 验证..."

if [ -n "$1" ]; then
  BACKEND_URL="$1"
else
  BACKEND_URL="http://localhost:8000"
fi

if curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/v1/health" 2>/dev/null | grep -q 200; then
  echo "   ✅ 后端运行正常"
else
  echo "   ⚠️  后端未响应。如果使用 Cloudflare Tunnel，请确保："
  echo "      1. 后端正在运行: uvicorn app.main:app --host 0.0.0.0 --port 8000"
  echo "      2. Tunnel 已启动: cloudflared tunnel --url http://localhost:8000"
fi

echo ""
echo "============================="
echo "✅ 部署完成！"
echo "   前端: https://paleoearth.pages.dev"
if [ -n "$1" ]; then
  echo "   后端: $1"
fi
echo ""
echo "💡 提示: 如果后端 URL 变了，重新运行："
echo "   bash deploy-cloudflare.sh <新的tunnel-url>"
echo "============================="
