from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from datetime import datetime
from app.database import Base

class DeviationSegment(Base):
    __tablename__ = "deviation_segments"

    segment_id = Column(Integer, primary_key = True, index = True)

    session_id = Column(Integer, ForeignKey("sessions.session_id"), nullable = False)
    calibration_id = Column(Integer, ForeignKey("calibrations.calibration_id"), nullable = False)

    start_time_ms = Column(Integer, nullable = False)
    end_time_ms = Column(Integer, nullable = False)
    duration_ms = Column(Integer, nullable = False)

    max_ema_score = Column(Float, nullable = False)
    avg_ema_score = Column(Float, nullable = False)

    threshold = Column(Float, nullable = False)

    reason = Column(String(255), nullable = True)

    created_at = Column(DateTime, default = datetime.utcnow)