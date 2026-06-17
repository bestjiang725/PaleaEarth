"""Common Pydantic schemas for API responses."""

from typing import Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    code: int = 200
    data: T | None = None
    msg: str = "success"


class PaginatedResponse(BaseModel, Generic[T]):
    code: int = 200
    data: list[T] = []
    total: int = 0
    page: int = 1
    page_size: int = 20
    msg: str = "success"
