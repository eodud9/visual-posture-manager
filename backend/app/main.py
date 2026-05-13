from fastapi import FastAPI

from app.database import Base, engine

# models import: create_all이 모든 테이블을 인식하도록 필요
from app import models

# routers import
from app.routers import task
from app.routers import calibration
from app.routers import session
from app.routers import posture_log
from app.routers import deviation_segment
from app.routers import alert
from app.routers import feedback
from app.routers import posture_ws
from app.routers import health


# DB 테이블 생성
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title = "VPM Backend API",
    description = "Visual Posture Manager 저장 API",
    version = "1.0.0"
)


# Router 등록
app.include_router(task.router, prefix = "/api")
app.include_router(calibration.router, prefix = "/api")
app.include_router(session.router, prefix = "/api")
app.include_router(posture_log.router, prefix = "/api")
app.include_router(deviation_segment.router, prefix = "/api")
app.include_router(alert.router, prefix = "/api")
app.include_router(feedback.router, prefix = "/api")
app.include_router(posture_ws.router)
app.include_router(health.router, prefix = "/api")


@app.get("/")
def read_root():
    return {
        "message": "VPM Backend API 서버가 실행 중입니다."
    }