import { saveCalibration } from "../../../api/calibrations";
import { useEffect, useRef, useState } from "react";
import { PostureEngine } from "../../../utils/postureEngine";

/**
 * MediaPipe + WebSocket 자세 분석
 * WebSocket 연결 실패 시 로컬 PostureEngine으로 자동 폴백
 *
 * @param {React.RefObject} videoRef - video 엘리먼트 ref
 * @param {string} status - 카메라 상태 ('idle'|'active'|'error')
 * @param {string} calibrationPhase - 'idle'|'calibrating'|'running'
 * @param {(phase: string) => void} setCalibrationPhase
 * @returns {{
 *   postureStatus: 'idle'|'calibrating'|'calibrated'|'monitoring',
 *   calibProgress: number,
 *   postureScore: number|null,
 *   isBadPosture: boolean,
 * }}
 */
export const usePoseDetection = (videoRef, status, calibrationPhase, setCalibrationPhase) => {
  const wsRef = useRef(null);
  const engineRef = useRef(null);
  const frameCountRef = useRef(0);

  const [postureStatus, setPostureStatus] = useState("idle");
  const [calibProgress, setCalibProgress] = useState(0);
  const [postureScore, setPostureScore] = useState(null);
  const [isBadPosture, setIsBadPosture] = useState(false);

  // 자세 분석 결과 처리 — ref로 래핑해 클로저 stale 방지
  const handlePostureResult = async (data) => {
    if (data.status === "CALIBRATING") {
      setPostureStatus("calibrating");
      setCalibProgress(data.progress);
    } else if (data.status === "CALIBRATED") {
      setCalibProgress(100);
      setPostureStatus("calibrated");

      try {
        await saveCalibration({
          sample_frame_count: data.sample_frame_count,
          feature_names: data.feature_names,
          feature_median: data.feature_median,
          covariance_matrix: data.covariance_matrix,
          threshold: data.threshold,
          alpha: data.alpha,
          landmarks_used: data.landmarks_used,
          ridge_applied: data.ridge_applied,
        });

        console.log("calibration saved");
      } catch (e) {
        console.error("calibration save failed", e);
      }

      setCalibrationPhase("running");
    } else if (data.status === "MONITORING") {
      setPostureScore(data.score);
      setIsBadPosture(data.is_bad);
    }
  };
  const handlePostureResultRef = useRef(handlePostureResult);
  handlePostureResultRef.current = handlePostureResult;

  // WebSocket 생명주기
  useEffect(() => {
    if (calibrationPhase === "idle") {
      wsRef.current?.close();
      wsRef.current = null;
      engineRef.current = null;
      setPostureStatus("idle");
      setCalibProgress(0);
      setPostureScore(null);
      setIsBadPosture(false);
      return;
    }

    const ws = new WebSocket("ws://localhost:8000/ws/posture");
    ws.onopen = () => setPostureStatus("calibrating");
    ws.onmessage = (e) => handlePostureResultRef.current(JSON.parse(e.data));
    ws.onerror = () => console.warn("[WS] 백엔드 연결 실패 — 로컬 엔진으로 폴백");
    ws.onclose = () => console.warn("[WS] 연결 종료");
    wsRef.current = ws;

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [calibrationPhase]);

  // MediaPipe 초기화
  useEffect(() => {
    if (status !== "active" || calibrationPhase === "idle") return;
    if (!window.Pose || !window.Camera) return;
    if (!videoRef.current) return;

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
      frameCountRef.current += 1;
      if (frameCountRef.current % 3 !== 0) return;

      const landmarks = results.poseLandmarks.map(({ x, y, z }) => ({ x, y, z }));

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ landmarks }));
      } else {
        if (!engineRef.current) engineRef.current = new PostureEngine();
        const result = engineRef.current.processFrame(landmarks);
        handlePostureResultRef.current(result);
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

    return () => {
      camera.stop();
      pose.close();
    };
  }, [status, calibrationPhase, videoRef]);

  return { postureStatus, calibProgress, postureScore, isBadPosture };
};
