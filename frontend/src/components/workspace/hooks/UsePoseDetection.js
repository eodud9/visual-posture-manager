import { saveCalibration } from "../../../api/calibrations";
import { useEffect, useRef, useState } from "react";
import { PostureEngine } from "../../../utils/postureEngine";

export const usePoseDetection = (videoRef, status, calibrationPhase, setCalibrationPhase) => {
  const wsRef = useRef(null);
  const engineRef = useRef(null);
  const frameCountRef = useRef(0);

  const poseRef = useRef(null);
  const cameraRef = useRef(null);

  const [postureStatus, setPostureStatus] = useState("idle");
  const [calibProgress, setCalibProgress] = useState(0);
  const [postureScore, setPostureScore] = useState(null);
  const [isBadPosture, setIsBadPosture] = useState(false);

  const handlePostureResult = async (data) => {
    if (data.status === "CALIBRATING") {
      setPostureStatus("calibrating");
      setCalibProgress(data.progress);
    } else if (data.status === "CALIBRATED") {
      setCalibProgress(100);
      setPostureStatus("calibrated");
      sessionStorage.setItem("isCalibrated", "true"); // ✅ 헤더 상태 표시 갱신용

      try {
        await saveCalibration({
          sampleFrameCount: data.sample_frame_count, // ✅ camelCase로 수정
          featureNames: data.feature_names,
          featureMedian: data.feature_median,
          covarianceMatrix: data.covariance_matrix,
          threshold: data.threshold,
          alpha: data.alpha,
          landmarksUsed: data.landmarks_used,
          ridgeApplied: data.ridge_applied,
        });
      } catch (e) {
        console.error(e);
      }

      setCalibrationPhase("running");
    } else if (data.status === "MONITORING") {
      setPostureScore(data.score);
      setIsBadPosture(data.is_bad);
    }
  };

  const handlePostureResultRef = useRef(handlePostureResult);
  handlePostureResultRef.current = handlePostureResult;

  // calibrationPhase를 ref로도 유지해서 mediapipe 클로저에서 최신값을 읽을 수 있게 함
  const calibrationPhaseRef = useRef(calibrationPhase);
  calibrationPhaseRef.current = calibrationPhase;

  /*
   * websocket
   */
  useEffect(() => {
    if (calibrationPhase === "idle") {
      wsRef.current?.close();
      wsRef.current = null;

      setPostureStatus("idle");
      setCalibProgress(0);
      setPostureScore(null);
      setIsBadPosture(false);
      return;
    }

    const ws = new WebSocket("ws://localhost:8000/ws/posture");

    ws.onopen = () => console.log("ws connected");
    ws.onmessage = (e) => handlePostureResultRef.current(JSON.parse(e.data));

    ws.onerror = () => console.warn("[WS] fallback local engine");

    wsRef.current = ws;

    return () => ws.close();
  }, [calibrationPhase]);

  /*
   * mediapipe (1회만)
   */
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

      const landmarks = results.poseLandmarks.map(({ x, y, z }) => ({ x, y, z }));

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ landmarks }));
      } else {
        if (!engineRef.current) {
          engineRef.current = new PostureEngine();
        }

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

    poseRef.current = pose;
    cameraRef.current = camera;

    return () => {
      cameraRef.current?.stop();
      poseRef.current?.close();

      cameraRef.current = null;
      poseRef.current = null;
    };
  }, [status]);

  return {
    postureStatus,
    calibProgress,
    postureScore,
    isBadPosture,
  };
};
