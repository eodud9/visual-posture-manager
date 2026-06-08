from sqlalchemy import Column, BigInteger, Integer, Float, String, DateTime, ForeignKey
from datetime import datetime
from app.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    alert_id = Column(Integer, primary_key = True, index = True)

    session_id = Column(Integer, ForeignKey("sessions.session_id"), nullable = False)
    deviation_segment_id = Column(Integer, ForeignKey("deviation_segments.segment_id"), nullable = False)

    warning_level = Column(Integer, nullable = False)

    triggered_at_ms = Column(BigInteger, nullable = False)
    deviation_duration_ms = Column(BigInteger, nullable = False)

    ema_score = Column(Float, nullable = False)
    threshold = Column(Float, nullable = False)

    warning_type = Column(String(100), nullable = False)

    created_at = Column(DateTime, default = datetime.utcnow)