"""Pydantic schemas for data query endpoints."""

from pydantic import BaseModel, Field


class PointQueryParams(BaseModel):
    lon: float = Field(..., ge=-180, le=180, description="经度")
    lat: float = Field(..., ge=-90, le=90, description="纬度")
    age_ma: float = Field(..., description="地质年代(Ma)")
    var_name: str = Field(..., description="变量名")
    month: int | None = Field(None, ge=1, le=12, description="月份")


class PointQueryResponse(BaseModel):
    lon: float
    lat: float
    age_ma: float
    var_name: str
    value: float | None = None
    units: str | None = None


class RegionQueryParams(BaseModel):
    lon_min: float = Field(..., ge=-180, le=180, description="西边界经度")
    lon_max: float = Field(..., ge=-180, le=180, description="东边界经度")
    lat_min: float = Field(..., ge=-90, le=90, description="南边界纬度")
    lat_max: float = Field(..., ge=-90, le=90, description="北边界纬度")
    age_ma: float = Field(..., description="地质年代")
    var_name: str = Field(..., description="变量名")
    month: int | None = Field(None, ge=1, le=12, description="月份")


class RegionQueryResponse(BaseModel):
    min: float | None = None
    max: float | None = None
    mean: float | None = None
    std: float | None = None
    count: int = 0
    units: str | None = None


class TimeSeriesPoint(BaseModel):
    age_ma: float
    value: float | None = None


class TimeSeriesParams(BaseModel):
    lon: float = Field(..., ge=-180, le=180, description="经度")
    lat: float = Field(..., ge=-90, le=90, description="纬度")
    var_name: str = Field(..., description="变量名")
    age_min: float | None = Field(None, description="起始年代")
    age_max: float | None = Field(None, description="结束年代")
    month: int | None = Field(None, ge=1, le=12, description="月份")


class TimeSeriesResponse(BaseModel):
    lon: float
    lat: float
    var_name: str
    units: str | None = None
    series: list[TimeSeriesPoint] = []
