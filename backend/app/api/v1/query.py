"""Data query API endpoints: /api/v1/query/*"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.exceptions import NotFoundException, ValidationException
from app.schemas.common import ApiResponse
from app.schemas.query import (
    PointQueryResponse,
    RegionQueryResponse,
    TimeSeriesResponse,
    TimeSeriesPoint,
)
from app.models.time_mapping import TimeMapping
from app.models.variable_meta import VariableMeta
from app.services.nc_service import NCDataService

router = APIRouter(tags=["数据查询"])


async def _get_nc_path(db: AsyncSession, age_ma: float) -> str:
    """Look up NC file path for a given age."""
    result = await db.execute(
        select(TimeMapping.file_path).where(TimeMapping.geologic_age_ma == age_ma)
    )
    row = result.first()
    if row is None:
        raise NotFoundException(40401, f"该地质年代({age_ma}Ma)无可用数据")
    return row[0]


async def _get_var_meta(db: AsyncSession, var_name: str) -> dict:
    """Look up variable metadata."""
    result = await db.execute(
        select(VariableMeta).where(VariableMeta.var_name == var_name)
    )
    row = result.scalar_one_or_none()
    if row is None:
        raise NotFoundException(40402, f"变量'{var_name}'不存在")
    return {
        "units": row.units,
        "display_name_zh": row.display_name_zh,
        "colormap": row.colormap,
    }


@router.get("/point")
async def query_point(
    lon: float = Query(..., ge=-180, le=180, description="经度"),
    lat: float = Query(..., ge=-90, le=90, description="纬度"),
    age_ma: float = Query(..., description="地质年代(Ma)"),
    var_name: str = Query(..., description="变量名"),
    month: int | None = Query(None, ge=1, le=12, description="月份"),
    db: AsyncSession = Depends(get_db),
):
    """查询单点气候值"""
    file_path = await _get_nc_path(db, age_ma)
    var_meta = await _get_var_meta(db, var_name)

    with NCDataService(file_path) as nc:
        value = nc.point_query(var_name, lon, lat)

    return ApiResponse(data={
        "lon": lon,
        "lat": lat,
        "age_ma": age_ma,
        "var_name": var_name,
        "value": round(value, 4) if value is not None else None,
        "units": var_meta["units"],
    })


@router.get("/region")
async def query_region(
    lon_min: float = Query(..., ge=-180, le=180, description="西边界经度"),
    lon_max: float = Query(..., ge=-180, le=180, description="东边界经度"),
    lat_min: float = Query(..., ge=-90, le=90, description="南边界纬度"),
    lat_max: float = Query(..., ge=-90, le=90, description="北边界纬度"),
    age_ma: float = Query(..., description="地质年代"),
    var_name: str = Query(..., description="变量名"),
    month: int | None = Query(None, ge=1, le=12, description="月份"),
    db: AsyncSession = Depends(get_db),
):
    """查询区域气候统计值"""
    if lon_min >= lon_max:
        raise ValidationException(40001, "lon_min 必须小于 lon_max")
    if lat_min >= lat_max:
        raise ValidationException(40001, "lat_min 必须小于 lat_max")

    file_path = await _get_nc_path(db, age_ma)
    var_meta = await _get_var_meta(db, var_name)

    with NCDataService(file_path) as nc:
        stats = nc.region_stats(var_name, lon_min, lon_max, lat_min, lat_max)

    stats["units"] = var_meta["units"]
    return ApiResponse(data=stats)


@router.get("/timeseries")
async def query_timeseries(
    lon: float = Query(..., ge=-180, le=180, description="经度"),
    lat: float = Query(..., ge=-90, le=90, description="纬度"),
    var_name: str = Query(..., description="变量名"),
    age_min: float | None = Query(None, description="起始年代"),
    age_max: float | None = Query(None, description="结束年代"),
    month: int | None = Query(None, ge=1, le=12, description="月份"),
    db: AsyncSession = Depends(get_db),
):
    """查询单点时间序列(多个地质年代)"""
    var_meta = await _get_var_meta(db, var_name)

    # Get all available ages
    query = select(TimeMapping).order_by(TimeMapping.geologic_age_ma)
    if age_min is not None:
        query = query.where(TimeMapping.geologic_age_ma >= age_min)
    if age_max is not None:
        query = query.where(TimeMapping.geologic_age_ma <= age_max)

    result = await db.execute(query)
    time_rows = result.scalars().all()

    series = []
    for row in time_rows:
        try:
            with NCDataService(row.file_path) as nc:
                value = nc.point_query(var_name, lon, lat)
            series.append(TimeSeriesPoint(
                age_ma=row.geologic_age_ma,
                value=round(value, 4) if value is not None else None,
            ))
        except Exception:
            series.append(TimeSeriesPoint(
                age_ma=row.geologic_age_ma,
                value=None,
            ))

    return ApiResponse(data={
        "lon": lon,
        "lat": lat,
        "var_name": var_name,
        "units": var_meta["units"],
        "series": [s.model_dump() for s in series],
    })
