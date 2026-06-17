"""Admin API endpoints: /api/v1/admin/*"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.schemas.common import ApiResponse
from app.models.time_mapping import TimeMapping
from app.models.variable_meta import VariableMeta
from app.models.task import Task
from app.services.task_manager import get_task_manager

router = APIRouter(tags=["管理接口"])


@router.get("/health")
async def health_check(
    db: AsyncSession = Depends(get_db),
):
    """系统健康检查"""
    health = {
        "status": "healthy",
        "db": "unknown",
        "task_manager": "ok",
    }

    # Check DB
    try:
        result = await db.execute(select(func.count()).select_from(TimeMapping))
        result.scalar()
        health["db"] = "ok"
    except Exception as e:
        health["db"] = f"error: {str(e)}"
        health["status"] = "unhealthy"

    return ApiResponse(data=health)


@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
):
    """获取系统统计信息"""
    # Count ages
    age_result = await db.execute(
        select(func.count()).select_from(TimeMapping)
    )
    total_ages = age_result.scalar() or 0

    # Count variables
    var_result = await db.execute(
        select(func.count()).select_from(VariableMeta)
    )
    total_vars = var_result.scalar() or 0

    # Count today's tasks (in-memory)
    task_mgr = get_task_manager()
    all_tasks, _ = task_mgr.list_tasks()

    return ApiResponse(data={
        "total_ages": total_ages,
        "total_vars": total_vars,
        "total_tasks_today": len(all_tasks),
        "version": "1.0.0",
    })
