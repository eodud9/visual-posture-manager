from sqlalchemy.orm import Session
from app.models.alert import Alert
from app.schemas.alert import AlertCreate

from fastapi import HTTPException
from app.models.session import Session as FocusSession
from app.models.deviation_segment import DeviationSegment

def create_alert(db: Session, session_id: int, body: AlertCreate):

    session = db.query(FocusSession).filter(
        FocusSession.session_id == session_id
    ).first()

    if session is None:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다.")

    segment = db.query(DeviationSegment).filter(
        DeviationSegment.segment_id == body.deviationSegmentId
    ).first()

    if segment is None:
        raise HTTPException(status_code=404, detail="자세 이탈 구간을 찾을 수 없습니다.")

    if segment.session_id != session_id:
        raise HTTPException(
            status_code=400,
            detail="해당 자세 이탈 구간은 이 세션에 속하지 않습니다."
        )

    alert = Alert(
        session_id = session_id,
        deviation_segment_id = body.deviationSegmentId,
        warning_level = body.warningLevel,
        triggered_at_ms = body.triggeredAtMs,
        deviation_duration_ms = body.deviationDurationMs,
        ema_score = body.emaScore,
        threshold = body.threshold,
        warning_type = body.warningType
    )

    db.add(alert)
    db.commit()
    db.refresh(alert)

    return alert