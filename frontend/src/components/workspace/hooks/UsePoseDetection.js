import { saveCalibration } from "../../../api/calibrations";
import { useEffect, useRef, useState } from "react";
import { PostureEngine } from "../../../utils/postureEngine";

export const usePoseDetection = (
  videoRef,
  status,
  calibrationPhase,
  setCalibrationPhase,
  sessionId, // ✅ sessionId 추가 — WS URL에 필요
) => {
  const wsRef = useRef(null);
  const engineRef = useRef(null);
  const frameCountRef = useRef(0);
  const poseRef = useRef(null);
  const cameraRef = useRef(null);

  const [postureStatus, setPostureStatus] = useState("idle");
  const [calibProgress, setCalibProgress] = useState(0);
  const [postureScore, setPostureScore] = useState(null);
  const [isBadPosture, setIsBadPosture] = useState(false);

  // 로컬 엔진 결과 처리 (캘리브레이션 단계)
  const handleLocalResult = async (data) => {
    if (data.status === "CALIBRATING") {
      setPostureStatus("calibrating");
      setCalibProgress(data.progress);
    } else if (data.status === "CALIBRATED") {
      setCalibProgress(100);
      setPostureStatus("calibrated");
      sessionStorage.setItem("isCalibrated", "true");
      try {
        await saveCalibration({
          sampleFrameCount: data.sample_frame_count,
          featureNames: data.feature_names,
          featureMedian: data.feature_median,
          covarianceMatrix: data.covariance_matrix,
          threshold: data.threshold,
          alpha: data.alpha,
          landmarksUsed: data.landmarks_used,
          ridgeApplied: data.ridge_applied,
        });
      } catch (e) {
        console.error("[Calibration] 저장 실패:", e);
      }
      setCalibrationPhase("running");
    }
  };

  // 백엔드 WS 분석 결과 처리 (모니터링 단계)
  const handleWsResult = (data) => {
    if (data.type !== "analysis_result") return;
    setPostureStatus("monitoring");
    setPostureScore(data.emaScore);
    setIsBadPosture(data.isOutlier);
  };

  const handleLocalResultRef = useRef(handleLocalResult);
  handleLocalResultRef.current = handleLocalResult;
  const handleWsResultRef = useRef(handleWsResult);
  handleWsResultRef.current = handleWsResult;

  const calibrationPhaseRef = useRef(calibrationPhase);
  calibrationPhaseRef.current = calibrationPhase;

  // ✅ 모니터링 단계 진입 + sessionId 확보 시 백엔드 WS 연결
  useEffect(() => {
    if (calibrationPhase !== "running" || !sessionId) return;

    const ws = new WebSocket(`ws://localhost:8000/ws/sessions/${sessionId}/posture`);

    ws.onopen = () => console.log("[WS] 백엔드 연결됨");
    ws.onmessage = (e) => handleWsResultRef.current(JSON.parse(e.data));
    ws.onerror = (e) => console.warn("[WS] 연결 오류:", e);
    ws.onclose = () => console.log("[WS] 연결 종료");

    wsRef.current = ws;

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [calibrationPhase, sessionId]);

  // calibrationPhase idle 복귀 시 상태 초기화
  useEffect(() => {
    if (calibrationPhase !== "idle") return;
    wsRef.current?.close();
    wsRef.current = null;
    engineRef.current = null;
    setPostureStatus("idle");
    setCalibProgress(0);
    setPostureScore(null);
    setIsBadPosture(false);
  }, [calibrationPhase]);

  // MediaPipe (1회만 초기화)
  useEffect(() => {
    if (status !== "active") return;
    if (!window.Pose || !window.Camera) return;
    if (!videoRef.current) return;
    if (poseRef.current) return;

    const pose = new window.Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults((results) => {
      if (!results.poseLandmarks) return;
      if (calibrationPhaseRef.current === "idle") return;

      frameCountRef.current++;
      if (frameCountRef.current % 3 !== 0) return;

      const phase = calibrationPhaseRef.current;

      if (phase === "calibrating") {
        // ✅ 캘리브레이션: 로컬 엔진이 처리
        const landmarks = results.poseLandmarks.map(({ x, y, z }) => ({
          x,
          y,
          z,
        }));
        if (!engineRef.current) engineRef.current = new PostureEngine();
        const result = engineRef.current.processFrame(landmarks);
        handleLocalResultRef.current(result);
      } else if (phase === "running") {
        // ✅ 모니터링: 백엔드 WS로 전송 (id + visibility 포함)
        if (wsRef.current?.readyState !== WebSocket.OPEN) return;

        const landmarks = results.poseLandmarks.map((lm, id) => ({
          id,
          x: lm.x,
          y: lm.y,
          z: lm.z,
          visibility: lm.visibility ?? 1.0,
        }));

        wsRef.current.send(
          JSON.stringify({
            type: "landmark_frame", // ✅ 백엔드가 기대하는 타입
            timestampMs: Date.now(), // ✅ 백엔드 deviation 시간 계산용
            landmarks,
          }),
        );
      }
    });

    const camera = new window.Camera(videoRef.current, {
      onFrame: async () => {
        await pose.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });

    camera.start();
    poseRef.current = pose;
    cameraRef.current = camera;

    return () => {
      cameraRef.current?.stop();
      poseRef.current?.close();
      cameraRef.current = null;
      poseRef.current = null;
    };
  }, [status]);

  return { postureStatus, calibProgress, postureScore, isBadPosture };
};
