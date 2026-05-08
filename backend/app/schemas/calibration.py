from pydantic import BaseModel
from typing import List
from datetime import datetime

class CalibrationCreate(BaseModel):
    sampleFrameCount: int
    featureNames: List[str]
    featureMedian: List[float]
    covarianceMatrix: List[List[float]]
    threshold: float
    alpha: float
    landmarksUsed: List[int]
    ridgeApplied: bool

class CalibrationResponse(BaseModel):
    calibrationId: int
    message: str

class CalibrationDetailResponse(BaseModel):
    calibrationId: int
    sampleFrameCount: int
    featureNames: List[str]
    featureMedian: List[float]
    covarianceMatrix: List[List[float]]
    threshold: float
    alpha: float
    landmarksUsed: List[int]
    ridgeApplied: bool
    createdAt: datetime 