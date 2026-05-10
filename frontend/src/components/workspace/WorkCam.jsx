import React, { useRef, useEffect, useState } from "react";
import { PostureEngine } from "../../utils/postureEngine";

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

export const WorkCam = ({ timeLeft, isRunning, setIsRunning, sessionId, calibrationPhase, setCalibrationPhase }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const pipWindowRef = useRef(null);
  const poseRef = useRef(null);
  const wsRef = useRef(null);
  const engineRef = useRef(null);
  const frameCountRef = useRef(0);

  const [status, setStatus] = useState("idle"); // 'idle' | 'active' | 'error'
  const [postureStatus, setPostureStatus] = useState("idle"); // 'idle' | 'calibrating' | 'calibrated' | 'monitoring'
  const [calibProgress, setCalibProgress] = useState(0);
  const [postureScore, setPostureScore] = useState(null);
  const [isBadPosture, setIsBadPosture] = useState(false);

  // 기존 getUserMedia 카메라 초기화
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatus("active");
      })
      .catch(() => setStatus("error"));

    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // 공통 결과 핸들러 — ref로 래핑해 useEffect 클로저에서 최신 값 참조
  const handlePostureResult = (data) => {
    if (data.status === "CALIBRATING") {
      setPostureStatus("calibrating");
      setCalibProgress(data.progress);
    } else if (data.status === "CALIBRATED") {
      setCalibProgress(100);
      setPostureStatus("calibrated");
      setCalibrationPhase("running");
      setTimeout(() => setPostureStatus("monitoring"), 1000);
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

  // MediaPipe 초기화 — calibrationPhase !== "idle" 이고 카메라 활성 시 시작
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
    poseRef.current = pose;

    return () => {
      camera.stop();
      pose.close();
      poseRef.current = null;
    };
  }, [status, calibrationPhase]);

  // PiP 타이머 텍스트 동기화
  useEffect(() => {
    if (!pipWindowRef.current) return;
    const timerEl = pipWindowRef.current.document.getElementById("pip-timer");
    if (timerEl) timerEl.textContent = formatTime(timeLeft);
  }, [timeLeft]);

  const handleFloatingMode = async () => {
    if (!("documentPictureInPicture" in window)) {
      alert("지원하지 않는 브라우저입니다");
      return;
    }

    const pipWindow = await documentPictureInPicture.requestWindow({ width: 300, height: 200 });
    pipWindowRef.current = pipWindow;

    pipWindow.addEventListener("pagehide", () => {
      setIsRunning(false);
      pipWindowRef.current = null;
    });

    pipWindow.document.body.style.cssText =
      "margin:0; height:100vh; background:#0B121B; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif; color:white;";

    const label = pipWindow.document.createElement("p");
    label.textContent = "FOCUS TIMER";
    label.style.cssText = "font-size:11px; letter-spacing:3px; color:#94a3b8; margin:0 0 14px;";

    const timer = pipWindow.document.createElement("p");
    timer.id = "pip-timer";
    timer.textContent = formatTime(timeLeft);
    timer.style.cssText = "font-size:64px; font-weight:800; margin:0; line-height:1; letter-spacing:-2px;";

    pipWindow.document.body.appendChild(label);
    pipWindow.document.body.appendChild(timer);
  };

  const indicatorColor = status === "active" ? "bg-green-500" : status === "error" ? "bg-red-500" : "bg-gray-500";
  const statusText = status === "active" ? "카메라 활성" : status === "error" ? "권한 거부됨" : "시스템 대기 중";

  return (
    <div className="relative bg-white border border-gray-300 p-3 rounded-lg shadow-sm flex items-center justify-between">
      <div className="flex items-center">
        <div className="bg-[#0B121B] w-30 h-20 rounded-lg flex items-center justify-center overflow-hidden">
          {status === "active" ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          ) : (
            <svg
              width="25"
              height="25"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <rect x="2" y="4.5" width="9" height="7" rx="1.5"></rect>
              <path d="M11 7l3-1.5v5L11 9z"></path>
            </svg>
          )}
        </div>
        <div className="text-gray-500 ml-5">
          <p>REAL-TIME VISION</p>
          <div className="flex gap-2 items-center">
            <div className={`w-2 h-2 rounded-full ${indicatorColor}`}></div>
            <span>{statusText}</span>
          </div>

          {postureStatus === "calibrating" && (
            <div>
              <div className="w-32 bg-gray-200 rounded h-1.5 mt-1">
                <div className="bg-[#2663EB] h-1.5 rounded" style={{ width: `${calibProgress}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">캘리브레이션 {calibProgress}/100</p>
            </div>
          )}
          {postureStatus === "calibrated" && (
            <p className="text-xs text-green-500 font-semibold mt-1">캘리브레이션 완료</p>
          )}
          {postureStatus === "monitoring" && (
            <div>
              <p className={`text-xs mt-1 ${isBadPosture ? "text-red-500 font-semibold" : "text-green-500"}`}>
                자세 점수: {postureScore}
              </p>
              {isBadPosture && <p className="text-xs text-red-400">자세를 바르게 해주세요</p>}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleFloatingMode}
        className="justify-items-end bg-[#2663EB] text-white px-5 py-3 rounded-lg font-bold transition-colors duration-200 hover:bg-blue-700 cursor-pointer"
      >
        Floating Mode
      </button>

      {calibrationPhase === "calibrating" && (
        <div className="absolute inset-0 rounded-lg bg-black/70 flex flex-col items-center justify-center">
          <p className="font-bold text-white">바른 자세를 유지해주세요</p>
          <div className="w-48 bg-gray-600 rounded h-1.5 mt-4">
            <div
              className="bg-[#2663EB] h-1.5 rounded transition-all duration-200"
              style={{ width: `${calibProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-300 mt-2">{calibProgress} / 100 프레임 수집 중</p>
        </div>
      )}
    </div>
  );
};
