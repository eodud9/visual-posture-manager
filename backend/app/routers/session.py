from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.session import (
    SessionCreate,
    SessionResponse,
    SessionDetailResponse,
    SessionPauseResponse,
    SessionResumeResponse,
    SessionEndResponse
)
from app.schemas.report import SessionReportResponse

from app.crud.session import (
    create_session,
    get_session,
    get_session_report,
    pause_session,
    resume_session,
    end_session
)

router = APIRouter(prefix = "/sessions", tags = ["Sessions"])

@router.post("", response_model = SessionResponse)
def save_session(body: SessionCreate, db: Session = Depends(get_db)):
    if body.focusMinutes <= 0 or body.breakMinutes < 0:
        raise HTTPException(status_code = 400, detail = "세션 시간 값이 올바르지 않습니다.")
    
    session = create_session(db, body)

    return {
        "sessionId": session.session_id,
        "message": "세션 생성 성공"
    }

@router.get("/{session_id}", response_model = SessionDetailResponse)
def read_session(session_id: int, db: Session = Depends(get_db)):
    session = get_session(db, session_id)

    return {
        "sessionId": session.session_id,
        "taskId": session.task_id,
        "calibrationId": session.calibration_id,
        "pomodoroPreset": session.pomodoro_preset,
        "focusMinutes": session.focus_minutes,
        "breakMinutes": session.break_minutes,
        "status": session.status,
        "startedAt": session.started_at,
        "endedAt": session.ended_at
    }


@router.get("/{session_id}/report", response_model = SessionReportResponse)
def read_session_report(session_id: int, db: Session = Depends(get_db)):
    return get_session_report(db, session_id)

@router.patch("/{session_id}/pause", response_model = SessionPauseResponse)
def pause_current_session(session_id: int, db: Session = Depends(get_db)):
    pause_event = pause_session(db, session_id)

    return {
        "sessionId": session_id,
        "pauseEventId": pause_event.pause_event_id,
        "pausedAt": pause_event.paused_at,
        "message": "세션 일시정지 성공"
    }


@router.patch("/{session_id}/resume", response_model = SessionResumeResponse)
def resume_current_session(session_id: int, db: Session = Depends(get_db)):
    pause_event = resume_session(db, session_id)

    return {
        "sessionId": session_id,
        "pauseEventId": pause_event.pause_event_id,
        "resumedAt": pause_event.resumed_at,
        "message": "세션 재개 성공"
    }


@router.patch("/{session_id}/end", response_model = SessionEndResponse)
def end_current_session(session_id: int, db: Session = Depends(get_db)):
    session = end_session(db, session_id)

    return {
        "sessionId": session.session_id,
        "endedAt": session.ended_at,
        "message": "세션 종료 성공"
    }