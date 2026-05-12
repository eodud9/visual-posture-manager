from sqlalchemy.orm import Session
from app.models.deviation_segment import DeviationSegment
from app.schemas.deviation_segment import DeviationSegmentCreate

from fastapi import HTTPException
from app.models.session import Session as FocusSession
from app.models.calibration import Calibration


def create_deviation_segment(db: Session, session_id: int, body: DeviationSegmentCreate):

    session = db.query(FocusSession).filter(
        FocusSession.session_id == session_id
    ).first()

    if session is None:
        raise HTTPException(status_code = 404, detail = "세션을 찾을 수 없습니다.")
    
    if session.status == "ENDED":
        raise HTTPException(status_code = 409, detail = "종료된 세션에는 저장할 수 없습니다.")

    calibration = db.query(Calibration).filter(
        Calibration.calibration_id == body.calibrationId
    ).first()

    if calibration is None:
        raise HTTPException(status_code = 404, detail = "캘리브레이션을 찾을 수 없습니다.")

    segment = DeviationSegment(
        session_id = session_id,
        calibration_id = body.calibrationId,
        start_time_ms = body.startTimeMs,
        end_time_ms = body.endTimeMs,
        duration_ms = body.durationMs,
        max_ema_score = body.maxEmaScore,
        avg_ema_score = body.avgEmaScore,
        threshold = body.threshold,
        reason = body.reason
    )

    db.add(segment)
    db.commit()
    db.refresh(segment)

    return segment