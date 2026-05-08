from sqlalchemy.orm import Session
from app.models.feedback import Feedback
from app.schemas.feedback import FeedbackCreate

from fastapi import HTTPException
from app.models.session import Session as FocusSession

def create_feedback(db: Session, session_id: int, body: FeedbackCreate):

    session = db.query(FocusSession).filter(
        FocusSession.session_id == session_id
    ).first()

    if session is None:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다.")
    
    existing_feedback = db.query(Feedback).filter(
        Feedback.session_id == session_id
    ).first()

    if existing_feedback is not None:
        raise HTTPException(
            status_code = 400,
            detail = "이미 피드백이 저장된 세션입니다."
        )

    feedback = Feedback(
        session_id = session_id,
        rating = body.rating,
        comment = body.comment
    )

    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    return feedback