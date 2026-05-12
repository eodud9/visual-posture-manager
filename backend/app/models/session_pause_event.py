from sqlalchemy import Column, Integer, DateTime, ForeignKey
from datetime import datetime, timezone
from app.database import Base

class SessionPauseEvent(Base):
    __tablename__ = "session_pause_events"

    pause_event_id = Column(Integer, primary_key = True, index = True)

    session_id = Column(Integer, ForeignKey("sessions.session_id"), nullable = False)

    paused_at = Column(DateTime, nullable = False)
    resumed_at = Column(DateTime, nullable = True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))