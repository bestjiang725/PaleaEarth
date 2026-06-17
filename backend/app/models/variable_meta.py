"""VariableMeta model: climate variable metadata."""

from datetime import datetime
from sqlalchemy import String, Integer, Float, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class VariableMeta(Base):
    __tablename__ = "variable_meta"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    var_name: Mapped[str] = mapped_column(
        String(64), nullable=False, unique=True, comment="变量名"
    )
    var_category: Mapped[str] = mapped_column(
        String(64), nullable=False, comment="变量类别"
    )
    display_name_zh: Mapped[str] = mapped_column(
        String(128), nullable=True, comment="中文显示名"
    )
    units: Mapped[str] = mapped_column(
        String(32), nullable=True, comment="单位"
    )
    colormap: Mapped[str] = mapped_column(
        String(64), default="RdYlBu_r", comment="默认色阶"
    )
    value_range_min: Mapped[float] = mapped_column(
        Float, nullable=True, comment="建议值域最小值"
    )
    value_range_max: Mapped[float] = mapped_column(
        Float, nullable=True, comment="建议值域最大值"
    )
    ndim: Mapped[int] = mapped_column(
        Integer, default=2, comment="变量维度"
    )
    extra_dims: Mapped[str] = mapped_column(
        Text, nullable=True, comment="额外维度信息(JSON)"
    )
    description: Mapped[str] = mapped_column(
        Text, nullable=True, comment="描述"
    )
    created_at: Mapped[str] = mapped_column(
        String(32), default=lambda: datetime.now().isoformat()
    )

    def __repr__(self):
        return f"<VariableMeta name={self.var_name} category={self.var_category}>"
