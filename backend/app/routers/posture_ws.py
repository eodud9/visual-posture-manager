# app/routers/posture_ws.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.crud.session import get_session
from app.crud.posture_log import create_posture_logs
from app.crud.calibration import get_calibration  # import 추가
from app.crud.deviation_segment import create_deviation_segment, update_deviation_segment
from app.crud.alert import create_alert

from app.schemas.deviation_segment import DeviationSegmentCreate
from app.schemas.alert import AlertCreate
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

    state = None

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

            # 마지막으로 처리한 프레임 시각 저장
            state.last_timestamp_ms = timestamp_ms

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

            # visibility 낮거나 어깨너비 부족한 프레임 — 조용히 스킵
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

            # 이탈 시작 시 deviation_segment 최초 생성
            if result["isOutlier"] and state.current_segment_id is None:
                initial_end_time_ms = timestamp_ms
                initial_duration_ms = result.get("deviationDurationMs", 0)

                # 이탈 첫 프레임에서는 startTimeMs와 endTimeMs가 같아서 durationMs가 0일 수 있음
                # DB에는 임시 segment를 먼저 만들고, 정상 복귀 또는 WebSocket 종료 시 최종 값으로 update함
                if initial_duration_ms <= 0:
                    initial_end_time_ms = timestamp_ms + 1
                    initial_duration_ms = 1

                segment_body = DeviationSegmentCreate(
                    calibrationId=session.calibration_id,
                    startTimeMs=state.deviation_start_time_ms,
                    endTimeMs=initial_end_time_ms,
                    durationMs=initial_duration_ms,
                    maxEmaScore=round(state.deviation_max_ema_score, 2),
                    avgEmaScore=round(
                        state.deviation_ema_sum / state.deviation_frame_count,
                        2
                    ) if state.deviation_frame_count > 0 else result["emaScore"],
                    threshold=result["threshold"],
                    reason="EMA score exceeded threshold"
                )

                segment = create_deviation_segment(db, session_id, segment_body)
                state.current_segment_id = segment.segment_id

            # 경고 발생 순간 alerts 저장
            warning_level = result["warningLevel"]

            if (
                result["isOutlier"]
                and warning_level > 0
                and state.current_segment_id is not None
                and warning_level not in state.triggered_warning_levels
            ):
                alert_body = AlertCreate(
                    deviationSegmentId=state.current_segment_id,
                    warningLevel=warning_level,
                    triggeredAtMs=timestamp_ms,
                    deviationDurationMs=result.get("deviationDurationMs", 0),
                    emaScore=result["emaScore"],
                    threshold=result["threshold"],
                    warningType=result["warningType"]
                )

                create_alert(db, session_id, alert_body)
                state.triggered_warning_levels.add(warning_level)


            # 정상 복귀 순간 deviation_segment 최종 업데이트
            if not result["isOutlier"] and state.current_segment_id is not None:
                end_time_ms = timestamp_ms
                duration_ms = end_time_ms - state.deviation_start_time_ms

                if duration_ms > 0 and state.deviation_frame_count > 0:
                    avg_ema_score = state.deviation_ema_sum / state.deviation_frame_count

                    update_deviation_segment(
                        db=db,
                        segment_id=state.current_segment_id,
                        end_time_ms=end_time_ms,
                        duration_ms=duration_ms,
                        max_ema_score=round(state.deviation_max_ema_score, 2),
                        avg_ema_score=round(avg_ema_score, 2)
                    )

                state.deviation_start_time_ms = None
                state.current_segment_id = None
                state.triggered_warning_levels.clear()
                state.deviation_max_ema_score = None
                state.deviation_ema_sum = 0.0
                state.deviation_frame_count = 0

    except WebSocketDisconnect:
        pass  # finally에서 처리

    finally:
        # WebSocket 종료 시 진행 중인 이탈 구간 최종 저장
        if (
            state is not None
            and state.current_segment_id is not None
            and state.deviation_start_time_ms is not None
            and state.last_timestamp_ms is not None
            and state.deviation_frame_count > 0
        ):

            end_time_ms = state.last_timestamp_ms
            duration_ms = end_time_ms - state.deviation_start_time_ms

            if duration_ms > 0:

                avg_ema_score = (
                    state.deviation_ema_sum /
                    state.deviation_frame_count
                )

                try:
                    update_deviation_segment(
                        db=db,
                        segment_id=state.current_segment_id,
                        end_time_ms=end_time_ms,
                        duration_ms=duration_ms,
                        max_ema_score=round(
                            state.deviation_max_ema_score,
                            2
                        ),
                        avg_ema_score=round(
                            avg_ema_score,
                            2
                        )
                    )
                except Exception:
                    pass

        # 세션 상태 제거
        remove_state(session_id)