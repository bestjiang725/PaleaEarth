"""Task model: async task tracking."""

from datetime import datetime
from sqlalchemy import String, Integer, Float, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class Task(Base):
    __tablename__ = "task"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, comment="任务UUID"
    )
    task_type: Mapped[str] = mapped_column(
        String(32), nullable=False, comment="任务类型: generate_overlay | export_nc"
    )
    status: Mapped[str] = mapped_column(
        String(16), nullable=False, default="pending",
        comment="状态: pending | running | done | fail"
    )
    params_json: Mapped[str] = mapped_column(
        Text, nullable=True, comment="任务参数JSON"
    )
    progress: Mapped[int] = mapped_column(
        Integer, default=0, comment="进度 0-100"
    )
    result_url: Mapped[str] = mapped_column(
        Text, nullable=True, comment="结果URL"
    )
    error_message: Mapped[str] = mapped_column(
        Text, nullable=True, comment="错误信息"
    )
    created_at: Mapped[str] = mapped_column(
        String(32), default=lambda: datetime.now().isoformat()
    )
    updated_at: Mapped[str] = mapped_column(
        String(32), default=lambda: datetime.now().isoformat()
    )

    def __repr__(self):
        return f"<Task id={self.id} type={self.task_type} status={self.status}>"
