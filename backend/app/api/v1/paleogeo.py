"""Paleogeography proxy endpoints — fetch from GPlates Web Service."""

from fastapi import APIRouter, Query
import httpx

from app.schemas.common import ApiResponse

router = APIRouter(tags=["古地理"])

GPLATES_BASE = "https://gws.gplates.org"
GPLATES_MODEL = "MERDITH2021"


@router.get("/coastlines")
async def get_coastlines(
    age_ma: float = Query(..., description="地质年代(Ma)"),
):
    """获取古海岸线 GeoJSON — 代理 GPlates Web Service"""
    url = f"{GPLATES_BASE}/reconstruct/coastlines/"
    params = {"time": age_ma, "model": GPLATES_MODEL}

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url, params=params)

    if resp.status_code == 200:
        return ApiResponse(data=resp.json())

    return ApiResponse(code=resp.status_code, data=None, msg=resp.text)
