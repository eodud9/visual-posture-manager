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

class DeviationDistributionItem(BaseModel):
    bucketStartMs: int
    bucketEndMs: int
    deviationCount: int
    totalDeviationMs: int

class SessionReportResponse(BaseModel):
    sessionId: int
    sessionStartMs: int  # ← 추가
    totalSessionMs: int
    totalDeviationMs: int
    deviationCount: int
    deviationRatio: float
    segments: List[DeviationSegmentReport]
    deviationDistribution: List[DeviationDistributionItem]