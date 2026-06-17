"""Pydantic schemas for time/geological endpoints."""

from pydantic import BaseModel, Field


class AgeItem(BaseModel):
    age_ma: float
    period: str
    era: str
    epoch: str | None = None
    available_var_count: int = 0


class VariableBrief(BaseModel):
    var_name: str
    display_name_zh: str | None = None
    units: str | None = None


class AgeDetail(AgeItem):
    file_group_id: str
    file_path: str | None = None
    resolution: str | None = None
    available_vars: list[VariableBrief] = []


class TimelineEpoch(BaseModel):
    name: str
    age_range: tuple[float, float]  # [youngest, oldest] Ma
    available_ages: list[float] = []  # data points within this epoch


class TimelinePeriod(BaseModel):
    name: str
    age_range: tuple[float, float]
    epochs: list[TimelineEpoch] = []


class TimelineEra(BaseModel):
    name: str
    periods: list[TimelinePeriod] = []


class TimelineResponse(BaseModel):
    eras: list[TimelineEra] = []
