from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.database import get_db
from app.schemas.deviation_segment import DeviationSegmentCreate, DeviationSegmentResponse
from app.crud.deviation_segment import create_deviation_segment

router = APIRouter(
    prefix = "/sessions/{session_id}/deviation-segments",
    tags = ["Deviation Segments"]
)

@router.post("", response_model = DeviationSegmentResponse)
def save_deviation_segment(
    session_id: int,
    body: DeviationSegmentCreate,
    db: Session = Depends(get_db)
):
    if body.endTimeMs <= body.startTimeMs:
        raise HTTPException(status_code = 400, detail = "endTimeMs는 startTimeMs보다 커야 합니다.")

    if body.durationMs != body.endTimeMs - body.startTimeMs:
        raise HTTPException(status_code = 400, detail = "durationMs가 시작/종료 시간과 맞지 않습니다.")
    
    if body.maxEmaScore < body.threshold:
        raise HTTPException(
            status_code = 400,
            detail = "maxEmaScore는 threshold 이상이어야 이탈 구간으로 저장할 수 있습니다."
        )

    segment = create_deviation_segment(db, session_id, body)

    return {
        "sessionId": session_id,
        "segmentId": segment.segment_id,
        "message": "자세 이탈 구간 저장 성공"
    }