"""Time-related API endpoints: /api/v1/time/*"""

from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.common import ApiResponse
from app.schemas.time import AgeItem, AgeDetail, TimelineResponse
from app.services.time_service import TimeService

router = APIRouter(tags=["时间查询"])


@router.get("/ages")
async def list_ages(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(100, ge=1, le=100, description="每页数量"),
    era: str | None = Query(None, description="按代筛选 (Paleozoic/Mesozoic/Cenozoic)"),
    db: AsyncSession = Depends(get_db),
):
    """获取所有可用地质年代列表"""
    service = TimeService(db)
    ages, total = await service.get_all_ages(era=era, page=page, page_size=page_size)
    return ApiResponse(
        data=ages,
        msg=f"共{total}个地质年代",
    )


@router.get("/ages/{age_ma}")
async def get_age_detail(
    age_ma: float = Path(..., description="地质年代(Ma)"),
    db: AsyncSession = Depends(get_db),
):
    """获取指定地质年代详细信息"""
    service = TimeService(db)
    detail = await service.get_age_detail(age_ma)
    return ApiResponse(data=detail)


@router.get("/ages/{age_ma}/variables")
async def get_age_variables(
    age_ma: float = Path(..., description="地质年代(Ma)"),
    db: AsyncSession = Depends(get_db),
):
    """获取指定地质年代所有可用变量列表"""
    service = TimeService(db)
    variables = await service.get_age_variables(age_ma)
    return ApiResponse(data=variables)


@router.get("/timeline")
async def get_timeline(
    db: AsyncSession = Depends(get_db),
):
    """获取地质年代表完整结构"""
    service = TimeService(db)
    timeline = await service.get_timeline()
    return ApiResponse(data=timeline)
