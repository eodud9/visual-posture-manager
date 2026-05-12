from sqlalchemy import Column, Integer, Float, Boolean, DateTime, JSON
from datetime import datetime, timezone
from app.database import Base

class Calibration(Base):
    __tablename__ = "calibrations"

    calibration_id = Column(Integer, primary_key = True, index = True)

    sample_frame_count = Column(Integer, nullable = False)
    feature_names = Column(JSON, nullable = False)
    feature_median = Column(JSON, nullable = False)
    covariance_matrix = Column(JSON, nullable = False)

    threshold = Column(Float, nullable = False)
    alpha = Column(Float, nullable = False)

    landmarks_used = Column(JSON, nullable = False)
    ridge_applied = Column(Boolean, nullable = False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))