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
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: show ? "rgba(22, 27, 38, 0.42)" : "rgba(22, 27, 38, 0)",
        backdropFilter: "blur(3px)",
        opacity: show ? 1 : 0,
        transition: "background 0.3s, opacity 0.3s",
      }}
    >
      <div
        style={{
          width: 860,
          maxWidth: "92vw",
          background: "var(--surface)",
          borderRadius: "var(--r-xl)",
          boxShadow: "var(--sh-lg)",
          padding: 28,
          transform: show ? "translateY(0) scale(1)" : "translateY(12px) scale(0.97)",
          transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            textAlign: "center",
            letterSpacing: "-0.02em",
            color: "var(--text)",
          }}
        >
          사용 가이드
        </h2>
        <p style={{ margin: "8px 0 22px", fontSize: 13, color: "var(--text-3)", textAlign: "center" }}>
          자세 가이드 확인 → 캘리브레이션 → 집중 시작 → 미니 화면
        </p>

        <div style={{ display: "flex", gap: 14 }}>
          {/* good posture */}
          <div
            style={{
              flex: 1,
              border: "1px solid var(--border)",
              borderRadius: "var(--r-lg)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: "var(--green-soft)",
                color: "var(--green)",
                padding: "9px 13px",
                fontSize: 13,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--green)",
                  display: "inline-block",
                }}
              />
              바른 자세
            </div>
            <img
              src={goodPostureImg}
              alt="바른 자세"
              style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}
            />
            <div
              style={{
                padding: "11px 13px",
                fontSize: 12,
                color: "var(--text-2)",
                lineHeight: 1.7,
                background: "var(--surface)",
              }}
            >
              귀–어깨 수직 정렬 · 허리 직립
              <br />
              팔꿈치 90° 유지
            </div>
          </div>

          {/* bad posture */}
          <div
            style={{
              flex: 1,
              border: "1px solid var(--border)",
              borderRadius: "var(--r-lg)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: "var(--red-soft)",
                color: "var(--red)",
                padding: "9px 13px",
                fontSize: 13,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <span
                style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--red)", display: "inline-block" }}
              />
              안 좋은 자세
            </div>
            <img
              src={badPostureImg}
              alt="안좋은 자세"
              style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}
            />
            <div
              style={{
                padding: "11px 13px",
                fontSize: 12,
                color: "var(--text-2)",
                lineHeight: 1.7,
                background: "var(--surface)",
              }}
            >
              거북목 · 굽은 등<br />
              어깨 비대칭 · 고개 숙임
            </div>
          </div>
        </div>

        <button
          onClick={onConfirm}
          style={{
            marginTop: 22,
            width: "100%",
            height: 50,
            background: "var(--brand)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--r-md)",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            boxShadow: "0 1px 1px rgba(20,28,46,0.12), inset 0 1px 0 rgba(255,255,255,0.12)",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--brand-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--brand)";
          }}
        >
          확인했습니다
        </button>
      </div>
    </div>
  );
};

export const Workspace = () => {
  const [timeLeft, setTimeLeft] = useState(parseTime("25:00"));
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [calibrationId, setCalibrationId] = useState(null);

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

  const onGuideConfirm = () => {
    setShowGuideModal(false);
  };
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
    <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
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
        calibrationId={calibrationId}
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
        setCalibrationId={setCalibrationId}
        calibrationId={calibrationId}
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
