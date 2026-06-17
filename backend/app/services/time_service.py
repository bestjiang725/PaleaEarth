"""TimeService: geological time query business logic."""

from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.time_mapping import TimeMapping
from app.core.exceptions import NotFoundException


class TimeService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_ages(
        self, era: str | None = None, page: int = 1, page_size: int = 100
    ) -> tuple[list[dict], int]:
        """Get paginated list of available geological ages."""
        query = select(TimeMapping).order_by(TimeMapping.geologic_age_ma)
        count_query = select(func.count()).select_from(TimeMapping)

        if era:
            query = query.where(TimeMapping.era_name == era)
            count_query = count_query.where(TimeMapping.era_name == era)

        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        offset = (page - 1) * page_size
        result = await self.db.execute(query.offset(offset).limit(page_size))
        rows = result.scalars().all()

        ages = []
        for row in rows:
            ages.append({
                "age_ma": row.geologic_age_ma,
                "period": row.period_name,
                "era": row.era_name,
                "epoch": row.epoch_name,
                "available_var_count": 20,  # All files have same vars
            })

        return ages, total

    async def get_age_detail(self, age_ma: float) -> dict:
        """Get detailed info for a specific geological age."""
        result = await self.db.execute(
            select(TimeMapping).where(TimeMapping.geologic_age_ma == age_ma)
        )
        row = result.scalar_one_or_none()
        if row is None:
            raise NotFoundException(40401, f"该地质年代({age_ma}Ma)无可用数据")

        return {
            "age_ma": row.geologic_age_ma,
            "period": row.period_name,
            "era": row.era_name,
            "epoch": row.epoch_name,
            "file_group_id": row.file_group_id,
            "file_path": row.file_path,
            "resolution": row.resolution,
            "grid_longitude": row.grid_longitude,
            "grid_latitude": row.grid_latitude,
        }

    async def get_age_variables(self, age_ma: float) -> list[dict]:
        """Get available variables for a specific age."""
        result = await self.db.execute(
            select(TimeMapping).where(TimeMapping.geologic_age_ma == age_ma)
        )
        row = result.scalar_one_or_none()
        if row is None:
            raise NotFoundException(40401, f"该地质年代({age_ma}Ma)无可用数据")

        # Get variables from the variable_meta table
        from app.models.variable_meta import VariableMeta
        var_result = await self.db.execute(select(VariableMeta))
        vars_rows = var_result.scalars().all()

        return [
            {
                "var_name": v.var_name,
                "display_name_zh": v.display_name_zh,
                "units": v.units,
                "category": v.var_category,
            }
            for v in vars_rows
        ]

    async def get_timeline(self) -> dict:
        """Build geological timeline structure with available data points."""
        # Get all ages from DB
        result = await self.db.execute(
            select(TimeMapping.geologic_age_ma).order_by(TimeMapping.geologic_age_ma)
        )
        available_ages = sorted([row[0] for row in result.all()])

        # Hardcoded Paleozoic geological timescale (ICS 2023)
        era = {
            "name": "Paleozoic",
            "periods": [
                {
                    "name": "Silurian",
                    "age_range": [419.2, 443.8],
                    "epochs": [
                        {"name": "Pridoli", "age_range": [419.2, 423.0]},
                        {"name": "Ludlow", "age_range": [423.0, 427.4]},
                        {"name": "Wenlock", "age_range": [427.4, 433.4]},
                        {"name": "Llandovery", "age_range": [433.4, 443.8]},
                    ],
                },
                {
                    "name": "Ordovician",
                    "age_range": [443.8, 485.4],
                    "epochs": [
                        {"name": "Late Ordovician", "age_range": [443.8, 458.4]},
                        {"name": "Middle Ordovician", "age_range": [458.4, 470.0]},
                        {"name": "Early Ordovician", "age_range": [470.0, 485.4]},
                    ],
                },
                {
                    "name": "Cambrian",
                    "age_range": [485.4, 538.8],
                    "epochs": [
                        {"name": "Furongian", "age_range": [485.4, 497.0]},
                        {"name": "Miaolingian / Series 3", "age_range": [497.0, 509.0]},
                        {"name": "Series 2", "age_range": [509.0, 521.0]},
                        {"name": "Terreneuvian", "age_range": [521.0, 538.8]},
                    ],
                },
            ],
        }

        # Tag epochs with available data points
        for period in era["periods"]:
            for epoch in period["epochs"]:
                epoch["available_ages"] = [
                    a for a in available_ages
                    if epoch["age_range"][0] <= a <= epoch["age_range"][1]
                ]

        return era
