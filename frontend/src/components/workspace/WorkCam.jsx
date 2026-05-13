import React, { useEffect, useRef } from "react";
import { usePoseDetection } from "./hooks/usePoseDetection";
import { usePostureAlert } from "./hooks/usePostureAlert";
import { usePip } from "./hooks/usePip";

const ALERT_STYLES = {
  0: { bg: "bg-white", border: "border-gray-300", pip: "#0B121B" },
  1: { bg: "bg-red-100", border: "border-red-500", pip: "#7f1d1d" },
  2: { bg: "bg-yellow-100", border: "border-yellow-400", pip: "#713f12" },
  3: { bg: "bg-yellow-100", border: "border-yellow-400", pip: "#713f12" },
};

export const WorkCam = ({
  stream,
  timeLeft,
  isRunning,
  setIsRunning,
  sessionId,
  calibrationPhase,
  setCalibrationPhase,
  setCalibProgress,
}) => {
  const videoRef = useRef(null);

  // stream 연결
  useEffect(() => {
    const video = videoRef.current;

    if (!stream || !video) return;

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    video.onloadedmetadata = () => {
      video.play().catch(() => {});
    };
  }, [stream]);

  // camera status 직접 계산
  const status = stream ? "active" : "loading";

  const { postureStatus, calibProgress, postureScore, isBadPosture } = usePoseDetection(
    videoRef,
    status,
    calibrationPhase,
    setCalibrationPhase,
  );
  useEffect(() => {
    setCalibProgress(calibProgress);
  }, [calibProgress, setCalibProgress]);

  const { alertLevel, showModal, closeModal } = usePostureAlert(isBadPosture, calibrationPhase);

  const { openPip } = usePip(timeLeft, ALERT_STYLES[alertLevel].pip, () => setIsRunning(false));

  const style = ALERT_STYLES[alertLevel];

  const indicatorColor = status === "active" ? "bg-green-500" : "bg-gray-500";

  const statusText = status === "active" ? "카메라 활성" : "시스템 대기 중";

  return (
    <>
      {/* 자세 경고 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 max-w-sm w-full mx-4">
            <div className="text-5xl">⚠️</div>

            <h2 className="text-xl font-black text-gray-800">자세 경고</h2>

            <p className="text-gray-500 text-sm text-center">
              3분 이상 자세가 틀어진 상태입니다.
              <br />
              잠시 스트레칭 후 바른 자세로 앉아주세요.
            </p>

            <button
              onClick={closeModal}
              className="bg-[#2563EB] text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* WorkCam */}
      <div
        className={`relative p-3 rounded-lg shadow-sm flex items-center justify-between border-2 transition-all duration-700 ease-in-out ${style.bg} ${style.border}`}
      >
        <div className="flex items-center">
          {/* 카메라 */}
          <div className="bg-[#0B121B] w-48 h-32 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
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
                <rect x="2" y="4.5" width="9" height="7" rx="1.5" />
                <path d="M11 7l3-1.5v5L11 9z" />
              </svg>
            )}
          </div>

          {/* 상태 */}
          <div className="text-gray-500 ml-5">
            <p>REAL-TIME VISION</p>

            <div className="flex gap-2 items-center">
              <div className={`w-2 h-2 rounded-full ${indicatorColor}`} />
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
                <p
                  className={`text-xs mt-1 font-semibold ${
                    alertLevel === 0 ? "text-green-500" : alertLevel === 1 ? "text-red-500" : "text-yellow-500"
                  }`}
                >
                  자세 점수: {postureScore}
                </p>

                {alertLevel === 1 && <p className="text-xs text-red-400">자세를 바르게 해주세요</p>}

                {alertLevel >= 2 && <p className="text-xs text-yellow-500 font-semibold">⚠️ 장시간 자세 이탈 중</p>}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={openPip}
          className="bg-[#2663EB] text-white px-5 py-3 rounded-lg font-bold transition-colors duration-200 hover:bg-blue-700 cursor-pointer"
        >
          Floating Mode
        </button>
      </div>
    </>
  );
};
