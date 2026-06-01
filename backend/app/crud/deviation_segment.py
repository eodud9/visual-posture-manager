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

def update_deviation_segment(
    db: Session,
    segment_id: int,
    end_time_ms: int,
    duration_ms: int,
    max_ema_score: float,
    avg_ema_score: float
):
    segment = db.query(DeviationSegment).filter(
        DeviationSegment.segment_id == segment_id
    ).first()

    if segment is None:
        raise HTTPException(status_code=404, detail="자세 이탈 구간을 찾을 수 없습니다.")

    segment.end_time_ms = end_time_ms
    segment.duration_ms = duration_ms
    segment.max_ema_score = max_ema_score
    segment.avg_ema_score = avg_ema_score

    db.commit()
    db.refresh(segment)

    return segment