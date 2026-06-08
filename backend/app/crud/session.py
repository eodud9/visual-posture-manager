from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime,timezone

from app.models.session import Session as FocusSession
from app.models.deviation_segment import DeviationSegment
from app.models.session_pause_event import SessionPauseEvent
from app.schemas.session import SessionCreate

from app.models.task import Task
from app.models.calibration import Calibration


def create_session(db: Session, body: SessionCreate):

    if body.taskId is not None:
        task = db.query(Task).filter(Task.task_id == body.taskId).first()
        if task is None:
            raise HTTPException(status_code = 404, detail = "할 일을 찾을 수 없습니다.")

    if body.calibrationId is not None:
        calibration = db.query(Calibration).filter(
            Calibration.calibration_id == body.calibrationId
        ).first()
        if calibration is None:
            raise HTTPException(status_code = 404, detail = "캘리브레이션을 찾을 수 없습니다.")

    session = FocusSession(
        task_id = body.taskId,
        calibration_id = body.calibrationId,
        pomodoro_preset = body.pomodoroPreset,
        focus_minutes = body.focusMinutes,
        break_minutes = body.breakMinutes,
        status="RUNNING"
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return session


def get_session(db: Session, session_id: int):
    session = db.query(FocusSession).filter(
        FocusSession.session_id == session_id
    ).first()

    if session is None:
        raise HTTPException(status_code = 404, detail = "세션을 찾을 수 없습니다.")

    return session

def _naive(dt):
    return dt.replace(tzinfo=None) if dt and dt.tzinfo else dt


def pause_session(db: Session, session_id: int):
    session = get_session(db, session_id)

    if session.ended_at is not None:
        raise HTTPException(status_code = 400, detail = "이미 종료된 세션은 일시정지할 수 없습니다.")

    if session.status == "PAUSED":
        raise HTTPException(status_code = 400, detail = "이미 일시정지 상태입니다.")

    pause_event = SessionPauseEvent(
        session_id = session_id,
        paused_at = datetime.now(timezone.utc)
    )

    session.status = "PAUSED"

    db.add(pause_event)
    db.commit()
    db.refresh(pause_event)

    return pause_event


def resume_session(db: Session, session_id: int):
    session = get_session(db, session_id)

    if session.ended_at is not None:
        raise HTTPException(status_code = 400, detail = "이미 종료된 세션은 재개할 수 없습니다.")

    if session.status != "PAUSED":
        raise HTTPException(status_code = 400, detail = "현재 일시정지 상태가 아닙니다.")

    pause_event = db.query(SessionPauseEvent).filter(
        SessionPauseEvent.session_id == session_id,
        SessionPauseEvent.resumed_at == None
    ).order_by(SessionPauseEvent.paused_at.desc()).first()

    if pause_event is None:
        raise HTTPException(status_code = 400, detail = "재개할 일시정지 기록이 없습니다.")

    pause_event.resumed_at = datetime.now(timezone.utc)
    session.status = "RUNNING"

    db.commit()
    db.refresh(pause_event)

    return pause_event


def end_session(db: Session, session_id: int):
    session = get_session(db, session_id)

    if session.ended_at is not None:
        raise HTTPException(status_code = 400, detail = "이미 종료된 세션입니다.")

    if session.status == "PAUSED":
        pause_event = db.query(SessionPauseEvent).filter(
            SessionPauseEvent.session_id == session_id,
            SessionPauseEvent.resumed_at == None
        ).order_by(SessionPauseEvent.paused_at.desc()).first()

        if pause_event is not None:
            pause_event.resumed_at = datetime.now(timezone.utc)

    session.ended_at = datetime.now(timezone.utc)
    session.status = "ENDED"

    db.commit()
    db.refresh(session)

    return session

def build_deviation_distribution(segments, total_session_ms: int, session_start_ms: int, bucket_size_ms: int = 60000):
    if total_session_ms <= 0:
        return []

    bucket_count = (total_session_ms + bucket_size_ms - 1) // bucket_size_ms

    distribution = [
        {
            "bucketStartMs": i * bucket_size_ms,
            "bucketEndMs": min((i + 1) * bucket_size_ms, total_session_ms),
            "deviationCount": 0,
            "totalDeviationMs": 0
        }
        for i in range(bucket_count)
    ]

    for segment in segments:
        # 절대 timestamp → 세션 상대 시간으로 변환
        rel_start = segment.start_time_ms - session_start_ms
        rel_end = segment.end_time_ms - session_start_ms

        for bucket in distribution:
            overlap_start = max(rel_start, bucket["bucketStartMs"])
            overlap_end = min(rel_end, bucket["bucketEndMs"])

            if overlap_start < overlap_end:
                bucket["deviationCount"] += 1
                bucket["totalDeviationMs"] += overlap_end - overlap_start

    return distribution

def get_session_report(db: Session, session_id: int):
    session = get_session(db, session_id)

    segments = db.query(DeviationSegment).filter(
        DeviationSegment.session_id == session_id
    ).all()

    pause_events = db.query(SessionPauseEvent).filter(
        SessionPauseEvent.session_id == session_id
    ).all()

    if session.ended_at is not None:
        total_elapsed_ms = int(
            (_naive(session.ended_at) - _naive(session.started_at)).total_seconds() * 1000
        )
    else:
        total_elapsed_ms = 0

    total_pause_ms = 0

    for event in pause_events:
        if event.resumed_at is not None:
            total_pause_ms += int(
                (_naive(event.resumed_at) - _naive(event.paused_at)).total_seconds() * 1000
            )

    total_session_ms = total_elapsed_ms - total_pause_ms

    if total_session_ms < 0:
        total_session_ms = 0

    total_deviation_ms = sum(segment.duration_ms for segment in segments)
    session_start_ms = int(session.started_at.replace(tzinfo=timezone.utc).timestamp() * 1000)
    deviation_count = len(segments)

    deviation_ratio = 0
    if total_session_ms > 0:
        deviation_ratio = total_deviation_ms / total_session_ms

    deviation_distribution = build_deviation_distribution(
        segments=segments,
        total_session_ms=total_session_ms,
        session_start_ms=session_start_ms,
        bucket_size_ms=60000
    )

    return {
        "sessionId": session.session_id,
        "sessionStartMs": int(session.started_at.replace(tzinfo=timezone.utc).timestamp() * 1000),
        "totalSessionMs": total_session_ms,
        "totalDeviationMs": total_deviation_ms,
        "deviationCount": deviation_count,
        "deviationRatio": round(deviation_ratio, 4),
        "segments": [
            {
                "segmentId": segment.segment_id,
                "startTimeMs": segment.start_time_ms,
                "endTimeMs": segment.end_time_ms,
                "durationMs": segment.duration_ms,
                "maxEmaScore": segment.max_ema_score,
                "avgEmaScore": segment.avg_ema_score,
                "threshold": segment.threshold,
                "reason": segment.reason
            }
            for segment in segments
        ],
        "deviationDistribution": deviation_distribution
    }