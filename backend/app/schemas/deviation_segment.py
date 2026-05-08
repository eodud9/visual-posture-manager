from pydantic import BaseModel
from typing import Optional

class DeviationSegmentCreate(BaseModel):
    calibrationId: int
    startTimeMs: int
    endTimeMs: int
    durationMs: int
    maxEmaScore: float
    avgEmaScore: float
    threshold: float
    reason: Optional[str] = None #선택 사항

class DeviationSegmentResponse(BaseModel):
    sessionId: int
    segmentId: int
    message: str