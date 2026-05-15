# app/routers/posture_ws.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.crud.session import get_session
from app.crud.posture_log import create_posture_logs
from app.crud.calibration import get_calibration  # import 추가

from app.schemas.posture_log import PostureLogCreate, PostureLogItem

from app.services.posture_analyzer import analyze_posture
from app.services.posture_state import get_state, remove_state



router = APIRouter(prefix="/ws", tags=["WebSocket"])


@router.websocket("/sessions/{session_id}/posture")
async def posture_websocket(
    websocket: WebSocket,
    session_id: int,
    db: Session = Depends(get_db)
):
    await websocket.accept()

    try:
        session = get_session(db, session_id)

        if session.calibration_id is None:
            await websocket.send_json({
                "type": "error",
                "code": "CALIBRATION_NOT_FOUND",
                "message": "세션에 연결된 calibration_id가 없습니다."
            })
            await websocket.close()
            return
        
        calibration = get_calibration(db, session.calibration_id)
        
        remove_state(session_id)   # ← 추가
        state = get_state(session_id)

        while True:
            data = await websocket.receive_json()

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

            try:
                result = analyze_posture(
                    landmarks=landmarks,
                    calibration=calibration,
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
            except Exception as e:
                import traceback
                traceback.print_exc()
                await websocket.send_json({
                    "type": "error",
                    "code": "ANALYSIS_FAILED",
                    "message": str(e)
                })
                continue

            # ✅ visibility 낮거나 어깨너비 부족한 프레임 — 조용히 스킵
            if result is None:
                continue

            features = result.get("features")

            if not isinstance(features, dict):
                await websocket.send_json({
                    "type": "error",
                    "code": "INVALID_FEATURES",
                    "message": "분석 결과 features는 dict 형식이어야 합니다."
                })
                continue

            required_features = {"zRatio", "neckTilt", "bodySlope"}
            if set(features.keys()) != required_features:
                await websocket.send_json({
                    "type": "error",
                    "code": "INVALID_FEATURES",
                    "message": "features는 zRatio, neckTilt, bodySlope를 정확히 포함해야 합니다."
                })
                continue

            # posture_logs 저장
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

            warning_level = result["warningLevel"]

            # ✅ 경고 단계 중복 전송 방지 — 한 이탈 구간에서 각 단계는 1회만 전송
            if warning_level > 0 and warning_level not in state.triggered_warning_levels:
                state.triggered_warning_levels.add(warning_level)
                await websocket.send_json({
                    "type": "analysis_result",
                    "sessionId": session_id,
                    "timestampMs": timestamp_ms,
                    "features": result["features"],
                    "mdScore": result["mdScore"],
                    "emaScore": result["emaScore"],
                    "threshold": result["threshold"],
                    "isOutlier": result["isOutlier"],
                    "warningLevel": warning_level,
                    "warningType": result["warningType"],
                    "deviationDurationMs": result.get("deviationDurationMs", 0)
                })
            else:
                # ✅ 경고 없는 일반 프레임은 isOutlier / emaScore만 전송 (매 프레임)
                await websocket.send_json({
                    "type": "analysis_result",
                    "sessionId": session_id,
                    "timestampMs": timestamp_ms,
                    "emaScore": result["emaScore"],
                    "threshold": result["threshold"],
                    "isOutlier": result["isOutlier"],
                    "warningLevel": warning_level,
                    "warningType": result["warningType"],
                    "deviationDurationMs": result.get("deviationDurationMs", 0)
                })

    except WebSocketDisconnect:
        pass  # finally에서 처리

    finally:
        # ✅ remove_state 단일 호출
        remove_state(session_id)