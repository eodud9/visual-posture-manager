from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.crud.session import get_session
from app.crud.posture_log import create_posture_logs
from app.schemas.posture_log import PostureLogCreate, PostureLogItem

from app.services.posture_analyzer import analyze_posture
from app.services.posture_state import get_state, remove_state


router = APIRouter(prefix = "/ws", tags = ["WebSocket"])


@router.websocket("/sessions/{session_id}/posture")
async def posture_websocket(
    websocket: WebSocket,
    session_id: int,
    db: Session = Depends(get_db)
):
    await websocket.accept()

    try:
        # 세션 존재 여부 확인
        session = get_session(db, session_id)

        # 세션에 calibration_id가 연결되어 있는지 확인
        if session.calibration_id is None:
            await websocket.send_json({
                "type": "error",
                "code": "CALIBRATION_NOT_FOUND",
                "message": "세션에 연결된 calibration_id가 없습니다."
            })
            await websocket.close()
            return

        # 세션별 상태 객체 가져오기
        state = get_state(session_id)

        while True:
            data = await websocket.receive_json()

            # 4. 메시지 타입 검증
            if data.get("type") != "landmark_frame":
                await websocket.send_json({
                    "type": "error",
                    "code": "INVALID_MESSAGE_TYPE",
                    "message": "message type은 landmark_frame이어야 합니다."
                })
                continue

            timestamp_ms = data.get("timestampMs")
            landmarks = data.get("landmarks")

            if timestamp_ms is None or landmarks is None:
                await websocket.send_json({
                    "type": "error",
                    "code": "INVALID_REQUEST",
                    "message": "timestampMs와 landmarks는 필수입니다."
                })
                continue

            # 최신 세션 상태 다시 조회
            session = get_session(db, session_id)

            if session.status == "PAUSED":
                await websocket.send_json({
                    "type": "session_paused",
                    "code": "SESSION_PAUSED",
                    "message": "세션이 일시정지 상태이므로 분석하지 않습니다."
                })
                continue

            if session.status == "ENDED":
                await websocket.send_json({
                    "type": "error",
                    "code": "SESSION_ENDED",
                    "message": "종료된 세션입니다. WebSocket 연결을 종료합니다."
                })
                await websocket.close()
                break


            # service 계층에서 자세 분석
            try:
                result = analyze_posture(
                    landmarks=landmarks,
                    calibration=session.calibration,
                    state=state,
                    timestamp_ms=timestamp_ms
                )
            except ValueError as e:
                await websocket.send_json({
                    "type": "error",
                    "code": "INVALID_LANDMARKS",
                    "message": str(e)
                })
                continue
            except Exception:
                await websocket.send_json({
                    "type": "error",
                    "code": "ANALYSIS_FAILED",
                    "message": "자세 분석 중 오류가 발생했습니다."
                })
                continue

            # 분석 결과 features 구조 검증
            required_features = {"zRatio", "neckTilt", "bodySlope"}
            features = result.get("features")

            if not isinstance(features, dict):
                await websocket.send_json({
                    "type": "error",
                    "code": "INVALID_FEATURES",
                    "message": "분석 결과 features는 dict 형식이어야 합니다."
                })
                continue

            if set(features.keys()) != required_features:
                await websocket.send_json({
                    "type": "error",
                    "code": "INVALID_FEATURES",
                    "message": "features는 zRatio, neckTilt, bodySlope를 정확히 포함해야 합니다."
                })
                continue

            # 분석 결과를 posture_logs에 저장
            log_body = PostureLogCreate(
                calibrationId=session.calibration_id,
                logs=[
                    PostureLogItem(
                        timestampMs=timestamp_ms,
                        features=result["features"],
                        mdScore=result["mdScore"],
                        emaScore=result["emaScore"],
                        isOutlier=result["isOutlier"]
                    )
                ]
            )

            create_posture_logs(db, session_id, log_body)

            # 프론트엔드로 분석 결과 반환
            await websocket.send_json({
                "type": "analysis_result",
                "sessionId": session_id,
                "timestampMs": timestamp_ms,
                "features": result["features"],
                "mdScore": result["mdScore"],
                "emaScore": result["emaScore"],
                "threshold": result["threshold"],
                "isOutlier": result["isOutlier"],
                "warningLevel": result["warningLevel"],
                "warningType": result["warningType"],
                "deviationDurationMs": result.get("deviationDurationMs", 0)
            })

    except WebSocketDisconnect:
        remove_state(session_id)

    finally:
        remove_state(session_id)