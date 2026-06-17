"""Pydantic schemas for task management endpoints."""

from pydantic import BaseModel


class TaskStatusResponse(BaseModel):
    task_id: str
    task_type: str
    status: str  # pending | running | done | fail
    progress: int = 0
    result_url: str | None = None
    error_message: str | None = None
    created_at: str | None = None


class TaskListResponse(BaseModel):
    tasks: list[TaskStatusResponse] = []
    total: int = 0
    page: int = 1
    page_size: int = 20
