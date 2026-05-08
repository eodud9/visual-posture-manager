from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.alert import AlertCreate, AlertResponse
from app.crud.alert import create_alert

router = APIRouter(
    prefix = "/sessions/{session_id}/alerts",
    tags = ["Alerts"]
)

@router.post("", response_model = AlertResponse)
def save_alert(
    session_id: int,
    body: AlertCreate,
    db: Session = Depends(get_db)
):
    if body.warningLevel == 1 and body.deviationDurationMs < 5000:
        raise HTTPException(status_code = 400, detail = "1단계 경고는 5초 이상 이탈 시 저장할 수 있습니다.")

    if body.warningLevel == 2 and body.deviationDurationMs < 30000:
        raise HTTPException(status_code = 400, detail = "2단계 경고는 30초 이상 이탈 시 저장할 수 있습니다.")

    if body.warningLevel == 3 and body.deviationDurationMs < 180000:
        raise HTTPException(status_code = 400, detail = "3단계 경고는 180초 이상 이탈 시 저장할 수 있습니다.")

    alert = create_alert(db, session_id, body)

    return {
        "sessionId": session_id,
        "alertId": alert.alert_id,
        "message": "경고 이벤트 저장 성공"
    }