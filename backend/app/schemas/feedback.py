from pydantic import BaseModel
from typing import Optional

class FeedbackCreate(BaseModel):
    rating: int
    comment: Optional[str] = None

class FeedbackResponse(BaseModel):
    sessionId: int
    feedbackId: int
    message: str