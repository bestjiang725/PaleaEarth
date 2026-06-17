"""Tile/Overlay serving endpoints: /api/v1/tiles/*"""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pathlib import Path

from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.schemas.common import ApiResponse
from app.models.time_mapping import TimeMapping
from app.models.variable_meta import VariableMeta
from app.services.nc_service import NCDataService
from app.services.tile_service import TileService

router = APIRouter(tags=["瓦片服务"])


@router.get("/overlay/{age_ma}/{var_name}.png")
async def get_overlay(
    age_ma: float,
    var_name: str,
    db: AsyncSession = Depends(get_db),
):
    """获取气候数据覆盖图PNG（自动生成+缓存）"""
    # Validate inputs
    result = await db.execute(
        select(TimeMapping).where(TimeMapping.geologic_age_ma == age_ma)
    )
    time_row = result.scalar_one_or_none()
    if time_row is None:
        raise NotFoundException(40401, f"该地质年代({age_ma}Ma)无可用数据")

    var_result = await db.execute(
        select(VariableMeta).where(VariableMeta.var_name == var_name)
    )
    var_row = var_result.scalar_one_or_none()
    if var_row is None:
        raise NotFoundException(40402, f"变量'{var_name}'不存在")

    tile_service = TileService()

    # Return cached file if exists
    if tile_service.is_cached(age_ma, var_name):
        cached_path = tile_service._get_overlay_path(age_ma, var_name)
        return FileResponse(
            cached_path,
            media_type="image/png",
            headers={"Cache-Control": "max-age=86400"},
        )

    # Generate synchronously
    with NCDataService(time_row.file_path) as nc:
        data = nc.get_variable_2d(var_name)
        lons = nc.get_lons()
        lats = nc.get_lats()

    colormap = var_row.colormap or "RdYlBu_r"
    overlay_path = tile_service.generate_overlay(
        data, lons, lats,
        age_ma=age_ma,
        var_name=var_name,
        colormap=colormap,
        vmin=var_row.value_range_min,
        vmax=var_row.value_range_max,
    )

    full_path = tile_service._get_overlay_path(age_ma, var_name)
    return FileResponse(
        full_path,
        media_type="image/png",
        headers={"Cache-Control": "max-age=86400"},
    )


@router.get("/overlay/{age_ma}/{var_name}/info")
async def get_overlay_info(
    age_ma: float,
    var_name: str,
    db: AsyncSession = Depends(get_db),
):
    """获取覆盖图元信息（值域范围，用于前端色标）"""
    var_result = await db.execute(
        select(VariableMeta).where(VariableMeta.var_name == var_name)
    )
    var_row = var_result.scalar_one_or_none()
    if var_row is None:
        raise NotFoundException(40402, f"变量'{var_name}'不存在")

    # If overlay exists, get actual data range
    tile_service = TileService()
    overlay_url = f"/api/v1/tiles/overlay/{age_ma:.0f}/{var_name}.png"

    result = await db.execute(
        select(TimeMapping).where(TimeMapping.geologic_age_ma == age_ma)
    )
    time_row = result.scalar_one_or_none()

    vmin, vmax = var_row.value_range_min, var_row.value_range_max
    if time_row is not None:
        try:
            with NCDataService(time_row.file_path) as nc:
                data = nc.get_variable_2d(var_name)
                vmin, vmax = tile_service.get_data_range(data)
        except Exception:
            pass

    return ApiResponse(data={
        "overlay_url": overlay_url,
        "min_value": vmin,
        "max_value": vmax,
        "units": var_row.units,
        "colormap": var_row.colormap,
    })
