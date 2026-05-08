from pydantic import BaseModel
from typing import List, Dict


class PostureLogItem(BaseModel):
    timestampMs: int
    features: Dict[str,float]
    mdScore: float
    emaScore: float
    isOutlier: bool

class PostureLogCreate(BaseModel):
    calibrationId: int
    logs: List[PostureLogItem]

class PostureLogResponse(BaseModel):
    sessionId: int
    savedCount: int
    message: str
    