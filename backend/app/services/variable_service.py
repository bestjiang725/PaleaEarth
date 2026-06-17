"""VariableService: climate variable metadata business logic."""

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.variable_meta import VariableMeta
from app.core.exceptions import NotFoundException


class VariableService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_variables(self, category: str | None = None) -> list[dict]:
        """Get all climate variable metadata, optionally filtered by category."""
        query = select(VariableMeta).order_by(VariableMeta.var_category, VariableMeta.var_name)
        if category:
            query = query.where(VariableMeta.var_category == category)

        result = await self.db.execute(query)
        rows = result.scalars().all()

        return [
            {
                "var_name": v.var_name,
                "category": v.var_category,
                "display_name_zh": v.display_name_zh,
                "units": v.units,
                "colormap": v.colormap,
                "value_range": [v.value_range_min, v.value_range_max]
                if v.value_range_min is not None and v.value_range_max is not None
                else None,
                "ndim": v.ndim,
                "extra_dims": v.extra_dims,
                "description": v.description,
            }
            for v in rows
        ]

    async def get_variable_detail(self, var_name: str) -> dict:
        """Get detailed metadata for a specific variable."""
        result = await self.db.execute(
            select(VariableMeta).where(VariableMeta.var_name == var_name)
        )
        row = result.scalar_one_or_none()
        if row is None:
            raise NotFoundException(40402, f"变量'{var_name}'不存在")

        return {
            "var_name": row.var_name,
            "category": row.var_category,
            "display_name_zh": row.display_name_zh,
            "units": row.units,
            "colormap": row.colormap,
            "value_range": [row.value_range_min, row.value_range_max]
            if row.value_range_min is not None and row.value_range_max is not None
            else None,
            "ndim": row.ndim,
            "extra_dims": row.extra_dims,
            "description": row.description,
        }

    async def get_categories(self) -> list[dict]:
        """Get all variable categories with counts."""
        from sqlalchemy import func
        result = await self.db.execute(
            select(
                VariableMeta.var_category,
                func.count(VariableMeta.id).label("count"),
            ).group_by(VariableMeta.var_category)
        )
        rows = result.all()

        category_labels = {
            "temperature": "温度",
            "precipitation": "降水",
            "wind": "风场",
            "pressure": "气压",
            "cloud": "云量",
            "soil": "土壤",
            "evaporation": "蒸散发",
            "radiation": "辐射",
            "flux": "通量",
            "ice": "海冰",
            "snow": "积雪",
            "runoff": "径流",
            "humidity": "湿度",
            "wind_stress": "风应力",
        }

        return [
            {
                "category": row[0],
                "label": category_labels.get(row[0], row[0]),
                "count": row[1],
            }
            for row in rows
        ]
