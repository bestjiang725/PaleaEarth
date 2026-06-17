"""Task management API endpoints: /api/v1/task/*"""

from fastapi import APIRouter, Query, Path

from app.schemas.common import ApiResponse
from app.schemas.task import TaskStatusResponse, TaskListResponse
from app.services.task_manager import get_task_manager

router = APIRouter(tags=["任务状态"])


@router.get("/{task_id}/status")
async def get_task_status(
    task_id: str = Path(..., description="任务ID"),
):
    """查询异步任务状态"""
    task_mgr = get_task_manager()
    task = task_mgr.get_status(task_id)
    if task is None:
        return ApiResponse(code=40404, data=None, msg="任务不存在")

    return ApiResponse(data=TaskStatusResponse(
        task_id=task["task_id"],
        task_type=task["task_type"],
        status=task["status"],
        progress=task["progress"],
        result_url=task.get("result_url"),
        error_message=task.get("error_message"),
        created_at=str(task.get("created_at")),
    ).model_dump())


@router.get("/list")
async def list_tasks(
    status: str | None = Query(None, description="按状态筛选 (pending/running/done/fail)"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=50, description="每页数量"),
):
    """查询最近任务列表"""
    task_mgr = get_task_manager()
    tasks, total = task_mgr.list_tasks(status=status, page=page, page_size=page_size)

    return ApiResponse(data={
        "tasks": [
            TaskStatusResponse(
                task_id=t["task_id"],
                task_type=t["task_type"],
                status=t["status"],
                progress=t["progress"],
                result_url=t.get("result_url"),
                error_message=t.get("error_message"),
                created_at=str(t.get("created_at")),
            ).model_dump()
            for t in tasks
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    })


@router.post("/{task_id}/cancel")
async def cancel_task(
    task_id: str = Path(..., description="任务ID"),
):
    """取消进行中的任务"""
    task_mgr = get_task_manager()
    cancelled = task_mgr.cancel_task(task_id)
    if not cancelled:
        return ApiResponse(code=40901, data=None, msg="任务已完成或不存在，无法取消")
    return ApiResponse(msg="任务已取消")
