from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.database import get_db
from app.schemas.posture_log import PostureLogCreate, PostureLogResponse
from app.crud.posture_log import create_posture_logs

router = APIRouter(
    prefix = "/sessions/{session_id}/posture-logs",
    tags = ["Posture Logs"]
)

@router.post("/batch", response_model = PostureLogResponse)
def save_posture_logs(
    session_id: int,
    body: PostureLogCreate,
    db: Session = Depends(get_db)
):
    if len(body.logs) == 0:
        raise HTTPException(status_code = 400, detail = "logs는 최소 1개 이상이어야 합니다.")
    
    required_features = {"zRatio", "neckTilt", "bodySlope"}

    for log in body.logs:
        if set(log.features.keys()) != required_features:
            raise HTTPException(
                status_code = 400,
                detail = "features는 zRatio, neckTilt, bodySlope를 정확히 포함해야 합니다."
            )

    result = create_posture_logs(db, session_id, body)

    return {
        "sessionId": result["session_id"],
        "savedCount": result["saved_count"],
        "message": "자세 로그 저장 성공"
    }
