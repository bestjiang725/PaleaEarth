"""Variable-related API endpoints: /api/v1/variable/*"""

from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.common import ApiResponse
from app.services.variable_service import VariableService

router = APIRouter(tags=["变量管理"])


@router.get("/list")
async def list_variables(
    category: str | None = Query(
        None,
        description="按类别筛选 (temperature/precipitation/wind/pressure/cloud/soil/evaporation/radiation/flux/ice/snow/runoff/humidity/wind_stress)",
    ),
    db: AsyncSession = Depends(get_db),
):
    """获取所有气候变量元数据列表"""
    service = VariableService(db)
    variables = await service.get_all_variables(category=category)
    return ApiResponse(data=variables)


@router.get("/categories")
async def get_categories(
    db: AsyncSession = Depends(get_db),
):
    """获取所有变量分类"""
    service = VariableService(db)
    categories = await service.get_categories()
    return ApiResponse(data=categories)


@router.get("/{var_name}")
async def get_variable_detail(
    var_name: str = Path(..., description="变量名"),
    db: AsyncSession = Depends(get_db),
):
    """获取指定变量详细元数据"""
    service = VariableService(db)
    detail = await service.get_variable_detail(var_name)
    return ApiResponse(data=detail)
