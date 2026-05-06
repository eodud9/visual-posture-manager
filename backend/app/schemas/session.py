from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SessionCreate(BaseModel):
    taskId: Optional[int] = None
    calibrationId: Optional[int] = None
    pomodoroPreset: Optional[str] = None
    focusMinutes: int
    breakMinutes: int

class SessionResponse(BaseModel):
    sessionId: int
    message: str

class SessionDetailResponse(BaseModel):
    sessionId: int
    taskId: Optional[int] = None
    calibrationId: Optional[int] = None
    pomodoroPreset: Optional[str] = None
    focusMinutes: int
    breakMinutes: int
    status: str
    startedAt: datetime
    endedAt: Optional[datetime] = None

class SessionPauseResponse(BaseModel):
    sessionId: int
    pauseEventId: int
    pausedAt: datetime
    message: str

class SessionResumeResponse(BaseModel):
    sessionId: int
    pauseEventId: int
    resumedAt: datetime
    message: str

class SessionEndResponse(BaseModel):
    sessionId: int
    endedAt: datetime
    message: str