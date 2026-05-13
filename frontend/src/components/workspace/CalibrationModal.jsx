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
        backgroundColor: show ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0)",
        opacity: show ? 1 : 0,
      }}
    >
      <div
        className="w-220 max-w-[92vw] rounded-2xl p-8 shadow-2xl transition-all duration-300 bg-white flex flex-col items-center"
        style={{
          transform: show ? "translateY(0) scale(1)" : "translateY(12px) scale(0.97)",
        }}
      >
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-3">자세 캘리브레이션</h2>
        <p className="text-sm text-gray-400 text-center mb-5">어깨와 머리가 가이드라인 안에 들어오도록 앉아주세요</p>

        <div className="relative w-[75%] aspect-video bg-black rounded-xl overflow-hidden shadow-md border-2 border-stone-200">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

          <div className="absolute inset-0 pointer-events-none">
            <svg
              viewBox="0 0 200 140"
              className="w-full h-full"
              preserveAspectRatio="xMidYMid meet"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="
    M 100 6
    C 70 6, 58 28, 58 52
    C 58 72, 68 84, 82 88
    C 76 90, 60 92, 44 100
    C 28 108, 10 116, 6 140
    M 194 140
    C 190 116, 172 108, 156 100
    C 140 92, 124 90, 118 88
    C 132 84, 142 72, 142 52
    C 142 28, 130 6, 100 6
  "
                fill="none"
                stroke="rgba(255, 255, 255, 0.85)"
                strokeWidth="0.8"
                strokeDasharray="6 4"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {calibrationPhase === "calibrating" && (
          <div className="mt-5 w-full">
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

        <div className="flex justify-center gap-3 mt-6 w-full">
          {calibrationPhase === "idle" && (
            <button
              onClick={handleStartCalibration}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors cursor-pointer"
            >
              캘리브레이션 시작
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-semibold transition-colors bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};
