from fastapi import APIRouter
from datetime import datetime

router = APIRouter(prefix = "/health", tags = ["Health"])

@router.get("")
def health_check():
    return {
        "status": "ok",
        "message": "서버 정상 동작 중",
        "checkedAt": datetime.utcnow()
    }