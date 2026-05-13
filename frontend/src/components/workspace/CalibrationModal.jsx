import React, { useEffect, useRef, useState } from "react";

export const CalibrationModal = ({ open, stream, calibProgress, calibrationPhase, setCalibrationPhase, onClose }) => {
  const videoRef = useRef(null);

  // 트랜지션을 위해 visible(마운트 유지)과 show(opacity 전환)를 분리
  const [visible, setVisible] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      // 다음 프레임에 show를 true로 줘야 CSS transition이 실제로 동작함
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setShow(true));
      });
    } else {
      setShow(false);
      // opacity 트랜지션(300ms) 끝난 후 언마운트
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!visible) return;
    const video = videoRef.current;
    if (!stream || !video) return;

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    if (video.readyState >= 1) {
      video.play().catch(() => {});
    } else {
      video.onloadedmetadata = () => {
        video.play().catch(() => {});
      };
    }
  }, [stream, visible]);

  if (!visible) return null;

  const handleStartCalibration = () => {
    setTimeout(() => {
      setCalibrationPhase("calibrating");
    }, 300);
  };

  return (
    <div
      className="fixed inset-0 z-999 flex items-center justify-center transition-opacity duration-300"
      style={{
        backgroundColor: show ? "rgba(13,38,80,0.65)" : "rgba(13,38,80,0)",
        opacity: show ? 1 : 0,
      }}
    >
      <div
        className="w-210 max-w-[92vw] rounded-2xl p-8 shadow-2xl transition-all duration-300"
        style={{
          background: "linear-gradient(145deg, #eff6ff 0%, #dbeafe 100%)",
          border: "1px solid #bfdbfe",
          transform: show ? "translateY(0) scale(1)" : "translateY(12px) scale(0.97)",
        }}
      >
        <h2 className="text-2xl font-bold mb-1 text-center text-blue-900">자세 캘리브레이션</h2>
        <p className="text-sm text-blue-400 text-center mb-5">어깨와 머리가 가이드라인 안에 들어오도록 앉아주세요</p>

        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-sm">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

          <div className="absolute inset-0 pointer-events-none">
            <svg
              viewBox="0 0 200 270"
              className="w-full h-full"
              preserveAspectRatio="xMidYMid meet"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 100 74 C 80 74, 62 84, 52 100 C 43 114, 40 132, 40 148 C 40 168, 47 184, 56 195 C 40 203, 22 212, 14 224 C 8 234, 6 248, 6 268 L 194 268 C 194 248, 192 234, 186 224 C 178 212, 160 203, 144 195 C 153 184, 160 168, 160 148 C 160 132, 157 114, 148 100 C 138 84, 120 74, 100 74 Z"
                fill="none"
                stroke="#60a5fa"
                strokeWidth="2.2"
                strokeDasharray="8 5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {calibrationPhase === "calibrating" && (
          <div className="mt-5">
            <div className="w-full h-3 bg-blue-100 rounded-full">
              <div
                className="bg-blue-600 h-3 rounded-full"
                style={{
                  width: `${calibProgress}%`,
                  transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </div>
            <p className="text-center mt-2 text-sm text-blue-700 font-medium">{calibProgress}%</p>
          </div>
        )}

        <div className="flex justify-center gap-3 mt-6">
          {calibrationPhase === "idle" && (
            <button
              onClick={handleStartCalibration}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
              캘리브레이션 시작
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-semibold transition-colors"
            style={{ background: "#dbeafe", color: "#1d4ed8" }}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};
