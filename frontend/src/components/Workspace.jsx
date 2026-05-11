import React, { useEffect, useState } from "react";
import { WorkHeader } from "./workspace/WorkHeader";
import { WorkTimer } from "./workspace/WorkTimer";
import { WorkCam } from "./workspace/WorkCam";
import { CalibrationModal } from "./workspace/CalibrationModal";
import goodPostureImg from "../assets/good-posture.png";
import badPostureImg from "../assets/bad-posture.png";

const parseTime = (timeStr) => {
  const [m, s] = timeStr.split(":").map(Number);
  return m * 60 + s;
};

const GuideModal = ({ open, onConfirm }) => {
  const [visible, setVisible] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setShow(true)));
    } else {
      setShow(false);
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center transition-opacity duration-300"
      style={{ backgroundColor: show ? "rgba(13,38,80,0.65)" : "rgba(13,38,80,0)", opacity: show ? 1 : 0 }}
    >
      <div
        className="w-250 h-130 max-w-[92vw] rounded-2xl p-8 shadow-2xl transition-all duration-300 flex flex-col items-center justify-center"
        style={{
          background: "linear-gradient(145deg, #eff6ff 0%, #dbeafe 100%)",
          border: "1px solid #bfdbfe",
          transform: show ? "translateY(0) scale(1)" : "translateY(12px) scale(0.97)",
        }}
      >
        <h2 className="text-2xl font-bold text-center text-blue-900 mb-1">사용 가이드</h2>
        <p className="text-sm text-blue-400 text-center mb-6">
          자세 가이드 확인 → 캘리브레이션 → 집중 시작 → Floating Mode
        </p>

        <div className="flex gap-4 mb-6 w-full">
          {/* 바른 자세 */}
          <div className="flex-1 rounded-xl overflow-hidden shadow-sm" style={{ border: "1px solid #bbf7d0" }}>
            <div className="bg-emerald-50 px-3 py-2 text-emerald-600 font-semibold text-sm">● 바른 자세</div>
            <img src={goodPostureImg} alt="바른 자세" className="w-full h-44 object-cover" />
            <div className="bg-white px-3 py-2 text-xs text-gray-500 space-y-0.5">
              <p>• 귀 - 어깨 수직 정렬</p>
              <p>• 허리 직립 • 팔꿈치 90°</p>
            </div>
          </div>

          {/* 안좋은 자세 */}
          <div className="flex-1 rounded-xl overflow-hidden shadow-sm" style={{ border: "1px solid #fecaca" }}>
            <div className="bg-red-50 px-3 py-2 text-red-500 font-semibold text-sm">● 안좋은 자세</div>
            <img src={badPostureImg} alt="안좋은 자세" className="w-full h-44 object-cover" />
            <div className="bg-white px-3 py-2 text-xs text-gray-500 space-y-0.5">
              <p>• 거북목 • 굽은 등</p>
              <p>• 어깨 비대칭 • 고개 숙임</p>
            </div>
          </div>
        </div>

        <button
          onClick={onConfirm}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors text-base"
        >
          확인했습니다
        </button>
      </div>
    </div>
  );
};

export const Workspace = () => {
  const [timeLeft, setTimeLeft] = useState(parseTime("00:05"));
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const [calibrationPhase, setCalibrationPhase] = useState("idle");
  const [showGuideModal, setShowGuideModal] = useState(true);
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);

  const [stream, setStream] = useState(null);
  const [calibProgress, setCalibProgress] = useState(0);

  useEffect(() => {
    let mediaStream;

    const init = async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setStream(mediaStream);
      } catch (e) {
        console.error(e);
      }
    };

    init();

    return () => {
      mediaStream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // 가이드 확인 완료 → 모달 닫고 워크스페이스 노출
  const onGuideConfirm = () => {
    setShowGuideModal(false);
  };

  // WorkTimer의 시작 버튼 → 캘리브레이션 모달
  const onStartRequest = () => {
    setShowCalibrationModal(true);
  };

  useEffect(() => {
    if (calibrationPhase === "running") {
      setShowCalibrationModal(false);
      setIsRunning(true);
    }
  }, [calibrationPhase]);

  return (
    <div className="p-4 flex flex-col gap-4">
      <WorkHeader />

      <WorkTimer
        timeLeft={timeLeft}
        setTimeLeft={setTimeLeft}
        isRunning={isRunning}
        setIsRunning={setIsRunning}
        sessionId={sessionId}
        setSessionId={setSessionId}
        calibrationPhase={calibrationPhase}
        setCalibrationPhase={setCalibrationPhase}
        onStartRequest={onStartRequest}
      />

      <WorkCam
        stream={stream}
        timeLeft={timeLeft}
        isRunning={isRunning}
        setIsRunning={setIsRunning}
        sessionId={sessionId}
        calibrationPhase={calibrationPhase}
        setCalibrationPhase={setCalibrationPhase}
        setCalibProgress={setCalibProgress}
      />

      <GuideModal open={showGuideModal} onConfirm={onGuideConfirm} />

      <CalibrationModal
        open={showCalibrationModal}
        stream={stream}
        calibProgress={calibProgress}
        calibrationPhase={calibrationPhase}
        setCalibrationPhase={setCalibrationPhase}
        onClose={() => setShowCalibrationModal(false)}
      />
    </div>
  );
};
