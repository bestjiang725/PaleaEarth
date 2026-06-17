"""TimeMapping model: geological age → NC file mapping."""

from datetime import datetime
from sqlalchemy import String, Integer, Float, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class TimeMapping(Base):
    __tablename__ = "time_mapping"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    geologic_age_ma: Mapped[float] = mapped_column(
        Float, nullable=False, unique=True, comment="地质年代（百万年）"
    )
    period_name: Mapped[str] = mapped_column(
        String(64), nullable=False, comment="纪名称"
    )
    era_name: Mapped[str] = mapped_column(
        String(64), nullable=False, comment="代名称"
    )
    epoch_name: Mapped[str] = mapped_column(
        String(64), nullable=True, comment="世名称"
    )
    file_path: Mapped[str] = mapped_column(
        Text, nullable=False, comment="NC文件绝对路径"
    )
    file_group_id: Mapped[str] = mapped_column(
        String(64), nullable=False, comment="文件组标识"
    )
    grid_longitude: Mapped[int] = mapped_column(
        Integer, default=96, comment="经度网格点数"
    )
    grid_latitude: Mapped[int] = mapped_column(
        Integer, default=73, comment="纬度网格点数"
    )
    resolution: Mapped[str] = mapped_column(
        String(32), default="3.75x2.5", comment="空间分辨率"
    )
    created_at: Mapped[str] = mapped_column(
        String(32), default=lambda: datetime.now().isoformat()
    )
    updated_at: Mapped[str] = mapped_column(
        String(32), default=lambda: datetime.now().isoformat()
    )

    def __repr__(self):
        return f"<TimeMapping age={self.geologic_age_ma}Ma period={self.period_name}>"
