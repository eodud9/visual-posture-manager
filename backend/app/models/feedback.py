from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime, timezone
from app.database import Base

class Feedback(Base):
    __tablename__ = "feedbacks"

    feedback_id = Column(Integer, primary_key = True, index = True)

    session_id = Column(Integer, ForeignKey("sessions.session_id"), nullable = False)

    rating = Column(Integer, nullable = False)
    comment = Column(String(500), nullable = True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))