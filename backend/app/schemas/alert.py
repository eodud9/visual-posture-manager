from pydantic import BaseModel
from typing import Literal

class AlertCreate(BaseModel):
    deviationSegmentId: int
    warningLevel: Literal[1,2,3]
    triggeredAtMs: int
    deviationDurationMs: int
    emaScore: float
    threshold: float
    warningType: str

class AlertResponse(BaseModel):
    sessionId: int
    alertId: int
    message: str