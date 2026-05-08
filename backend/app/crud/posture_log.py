from sqlalchemy.orm import Session
from app.models.posture_log import PostureLog
from app.schemas.posture_log import PostureLogCreate

from fastapi import HTTPException
from app.models.session import Session as FocusSession
from app.models.calibration import Calibration


def create_posture_logs(db: Session, session_id: int, body: PostureLogCreate):

    session = db.query(FocusSession).filter(
        FocusSession.session_id == session_id
    ).first()

    if session is None:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다.")

    calibration = db.query(Calibration).filter(
        Calibration.calibration_id == body.calibrationId
    ).first()

    if calibration is None:
        raise HTTPException(status_code = 404, detail = "캘리브레이션을 찾을 수 없습니다.")

    logs = []

    for item in body.logs: # body.logs: 프레임 로그 여러 개가 들어있는 리스트
        log = PostureLog( # PostureLog 객체를 만든 뒤, logs 리스트에 모아서 한 번에 저장
            session_id = session_id,
            calibration_id = body.calibrationId,
            timestamp_ms = item.timestampMs,
            features = item.features,
            md_score = item.mdScore,
            ema_score = item.emaScore,
            is_outlier = item.isOutlier
        )
        logs.append(log)

    db.add_all(logs)
    db.commit()

    return {
        "session_id": session_id, # 어떤 세션이 저장됐는지
        "saved_count": len(logs) # 몇 개 저장됐는지
    }