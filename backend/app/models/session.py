from sqlalchemy import Column, Integer, ForeignKey, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

class Session(Base):
    __tablename__ = "sessions"

    session_id = Column(Integer, primary_key = True, index = True)
    task_id = Column(Integer, ForeignKey("tasks.task_id"), nullable = True)
    calibration_id = Column(Integer, ForeignKey("calibrations.calibration_id"), nullable = True)

    pomodoro_preset = Column(String(50), nullable = True)

    focus_minutes = Column(Integer, nullable = False)
    break_minutes = Column(Integer, nullable = False)

    status = Column(String(30), nullable = False, default = "RUNNING")

    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    ended_at = Column(DateTime, nullable = True)

    task = relationship("Task")
    calibration = relationship("Calibration")