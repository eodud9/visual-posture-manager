import React, { useRef, useEffect, useState } from "react";

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

export const WorkCam = ({ timeLeft, isRunning, setIsRunning }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const pipWindowRef = useRef(null);
  const [status, setStatus] = useState("idle"); // 'idle' | 'active' | 'error'

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStatus("active");
      })
      .catch(() => {
        ``;
        setStatus("error");
      });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // PiP 창이 열려 있을 때 timeLeft 변경마다 텍스트 직접 업데이트
  useEffect(() => {
    if (!pipWindowRef.current) return;
    const timerEl = pipWindowRef.current.document.getElementById("pip-timer");
    if (timerEl) {
      timerEl.textContent = formatTime(timeLeft);
    }
  }, [timeLeft]);

  const handleFloatingMode = async () => {
    if (!("documentPictureInPicture" in window)) {
      alert("지원하지 않는 브라우저입니다");
      return;
    }

    const pipWindow = await documentPictureInPicture.requestWindow({
      width: 300,
      height: 200,
    });
    pipWindowRef.current = pipWindow;

    pipWindow.addEventListener("pagehide", () => {
      setIsRunning(false);
      pipWindowRef.current = null;
    });

    // 인라인 스타일로 타이머 UI 구성
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
    <div className="bg-white border border-gray-300 p-10 mt-5 rounded-lg shadow-sm flex items-center justify-between">
      <div className="flex items-center">
        <div className="bg-[#0B121B] w-20 h-20 rounded-lg flex items-center justify-center overflow-hidden">
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
        </div>
      </div>
      <button
        onClick={handleFloatingMode}
        className="justify-items-end bg-[#2663EB] text-white px-5 py-3 rounded-lg font-bold transition-colors duration-200 hover:bg-blue-700 cursor-pointer"
      >
        Floating Mode
      </button>
    </div>
  );
};
