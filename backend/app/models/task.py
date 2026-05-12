from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime, timezone
from app.database import Base

class Task(Base):
    __tablename__ = "tasks"

    task_id = Column(Integer, primary_key = True, index = True)
    title = Column(String(255), nullable = False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))