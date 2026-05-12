from sqlalchemy import Column, Integer, Float, Boolean, DateTime, ForeignKey, JSON
from datetime import datetime, timezone
from app.database import Base

class PostureLog(Base):
    __tablename__ = "posture_logs"

    log_id = Column(Integer, primary_key = True, index = True)

    session_id = Column(Integer, ForeignKey("sessions.session_id"), nullable = False)
    calibration_id = Column(Integer, ForeignKey("calibrations.calibration_id"), nullable = False)

    timestamp_ms = Column(Integer, nullable = False)

    features = Column(JSON, nullable = False)

    md_score = Column(Float, nullable = False)
    ema_score = Column(Float, nullable = False)

    is_outlier = Column(Boolean, nullable = False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))