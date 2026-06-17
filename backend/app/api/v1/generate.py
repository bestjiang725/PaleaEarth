"""Generate API endpoints: /api/v1/generate/*"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.schemas.common import ApiResponse
from app.schemas.generate import GenerateOverlayRequest, GenerateOverlayResponse
from app.models.time_mapping import TimeMapping
from app.models.variable_meta import VariableMeta
from app.services.nc_service import NCDataService
from app.services.tile_service import TileService
from app.services.task_manager import get_task_manager

router = APIRouter(tags=["数据生成"])


@router.post("/overlay")
async def generate_overlay(
    req: GenerateOverlayRequest,
    db: AsyncSession = Depends(get_db),
):
    """提交 NC 数据覆盖图生成任务(异步)"""
    # Validate inputs
    result = await db.execute(
        select(TimeMapping).where(TimeMapping.geologic_age_ma == req.age_ma)
    )
    time_row = result.scalar_one_or_none()
    if time_row is None:
        raise NotFoundException(40401, f"该地质年代({req.age_ma}Ma)无可用数据")

    var_result = await db.execute(
        select(VariableMeta).where(VariableMeta.var_name == req.var_name)
    )
    var_row = var_result.scalar_one_or_none()
    if var_row is None:
        raise NotFoundException(40402, f"变量'{req.var_name}'不存在")

    # Create task
    task_mgr = get_task_manager()
    task_id = task_mgr.create_task(
        "generate_overlay",
        {"age_ma": req.age_ma, "var_name": req.var_name, "colormap": req.colormap},
    )

    # Check if already cached
    tile_service = TileService()
    if tile_service.is_cached(req.age_ma, req.var_name):
        cached_path = tile_service.get_cached_path(req.age_ma, req.var_name)
        task_mgr._tasks[task_id]["status"] = "done"
        task_mgr._tasks[task_id]["result_url"] = f"/storage/{cached_path}"
        task_mgr._tasks[task_id]["progress"] = 100
    else:
        # Run generation in background
        def do_generate(progress_callback=None):
            with NCDataService(time_row.file_path) as nc:
                data = nc.get_variable_2d(req.var_name)
                lons = nc.get_lons()
                lats = nc.get_lats()

            if progress_callback:
                progress_callback(50)

            tile_svc = TileService()
            colormap = req.colormap or var_row.colormap or "RdYlBu_r"

            overlay_path = tile_svc.generate_overlay(
                data, lons, lats,
                age_ma=req.age_ma,
                var_name=req.var_name,
                colormap=colormap,
                vmin=var_row.value_range_min,
                vmax=var_row.value_range_max,
            )

            if progress_callback:
                progress_callback(100)

            return f"/storage/{overlay_path}"

        task_mgr.run_task(task_id, do_generate)

    return ApiResponse(
        code=201,
        data={"task_id": task_id, "status": "pending"},
        msg="任务已提交",
    )
