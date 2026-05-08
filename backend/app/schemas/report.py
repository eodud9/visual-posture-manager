from pydantic import BaseModel
from typing import List, Optional

class DeviationSegmentReport(BaseModel):
    segmentId: int
    startTimeMs: int
    endTimeMs: int
    durationMs: int
    maxEmaScore: float
    avgEmaScore: float
    threshold: float
    reason: Optional[str]

class SessionReportResponse(BaseModel):
    sessionId: int
    totalSessionMs: int
    totalDeviationMs: int
    deviationCount: int
    deviationRatio: float
    segments: List[DeviationSegmentReport]