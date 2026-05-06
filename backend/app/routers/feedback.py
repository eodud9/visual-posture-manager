from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.database import get_db
from app.schemas.feedback import FeedbackCreate, FeedbackResponse
from app.crud.feedback import create_feedback

router = APIRouter(
    prefix = "/sessions/{session_id}/feedback",
    tags = ["Feedback"]
)

@router.post("", response_model = FeedbackResponse)
def save_feedback(
    session_id: int,
    body: FeedbackCreate,
    db: Session = Depends(get_db)
):
    if body.rating < 1 or body.rating > 5:
        raise HTTPException(status_code = 400, detail = "rating은 1~5 사이여야 합니다.")
    feedback = create_feedback(db, session_id, body)

    return {
        "sessionId": session_id,
        "feedbackId": feedback.feedback_id,
        "message": "피드백 저장 성공"
    }