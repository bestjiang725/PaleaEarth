"""Pydantic schemas for variable metadata endpoints."""

from pydantic import BaseModel


class VariableItem(BaseModel):
    var_name: str
    category: str
    display_name_zh: str | None = None
    units: str | None = None
    colormap: str = "RdYlBu_r"
    value_range: tuple[float, float] | None = None
    ndim: int = 2
    extra_dims: str | None = None
    description: str | None = None


class CategoryItem(BaseModel):
    category: str
    label: str
    variables: list[VariableItem] = []
