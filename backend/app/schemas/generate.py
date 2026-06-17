"""Pydantic schemas for tile generation endpoints."""

from pydantic import BaseModel, Field


class GenerateOverlayRequest(BaseModel):
    age_ma: float = Field(..., description="地质年代(Ma)")
    var_name: str = Field(..., description="变量名")
    colormap: str = Field("RdYlBu_r", description="色阶名称")
    format: str = Field("png", description="输出格式(png)")


class GenerateOverlayResponse(BaseModel):
    task_id: str
    status: str = "pending"


class GenerateNCRequest(BaseModel):
    age_ma: float = Field(..., description="地质年代")
    var_names: list[str] = Field(..., min_length=1, description="变量名列表")
    bbox: str | None = Field(None, description="裁剪范围 lon_min,lat_min,lon_max,lat_max")
    month: int | None = Field(None, ge=1, le=12, description="月份")
