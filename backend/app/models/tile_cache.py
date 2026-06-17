"""TileCache model: generated overlay cache index."""

from datetime import datetime
from sqlalchemy import String, Integer, Float, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class TileCache(Base):
    __tablename__ = "tile_cache"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    geologic_age_ma: Mapped[float] = mapped_column(
        Float, nullable=False, comment="地质年代"
    )
    var_name: Mapped[str] = mapped_column(
        String(64), nullable=False, comment="变量名"
    )
    overlay_path: Mapped[str] = mapped_column(
        Text, nullable=False, comment="覆盖图PNG相对路径"
    )
    value_min: Mapped[float] = mapped_column(
        Float, nullable=True, comment="数据最小值"
    )
    value_max: Mapped[float] = mapped_column(
        Float, nullable=True, comment="数据最大值"
    )
    image_width: Mapped[int] = mapped_column(
        Integer, nullable=True, comment="图片宽度"
    )
    image_height: Mapped[int] = mapped_column(
        Integer, nullable=True, comment="图片高度"
    )
    created_at: Mapped[str] = mapped_column(
        String(32), default=lambda: datetime.now().isoformat()
    )

    def __repr__(self):
        return f"<TileCache age={self.geologic_age_ma} var={self.var_name}>"
