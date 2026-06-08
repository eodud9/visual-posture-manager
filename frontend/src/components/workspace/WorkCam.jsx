import React, { useEffect, useRef } from "react";
import { usePoseDetection } from "./hooks/UsePoseDetection";
import { usePostureAlert } from "./hooks/UsePostureAlert";
import { usePip } from "./hooks/UsePip";

const ALERT_STYLES = {
  0: { bg: "bg-white", border: "border-gray-200", pip: "#0B121B" },
  1: { bg: "bg-red-200", border: "border-red-500", pip: "#dc2626" },
  2: { bg: "bg-yellow-100", border: "border-yellow-400", pip: "#f59e0b" },
  3: { bg: "bg-yellow-100", border: "border-yellow-400", pip: "#f59e0b" },
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
  setCalibrationId,
  calibrationId,
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!stream || !video) return;
    if (video.srcObject !== stream) video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play().catch(() => {});
    };
  }, [stream]);

  const status = stream ? "active" : "loading";

  const { postureStatus, calibProgress, postureScore, isBadPosture } = usePoseDetection(
    videoRef,
    status,
    calibrationPhase,
    setCalibrationPhase,
    sessionId,
    setCalibrationId,
  );

  useEffect(() => {
    setCalibProgress(calibProgress);
  }, [calibProgress, setCalibProgress]);

  const { alertLevel, showModal, closeModal } = usePostureAlert(isBadPosture, calibrationPhase);
  const { openPip } = usePip(timeLeft, ALERT_STYLES[alertLevel].pip, alertLevel, () => setIsRunning(false));

  const isMonitoring = postureStatus === "monitoring";
  const isCalibrating = postureStatus === "calibrating";

  /* border color based on alert */
  const borderColor = alertLevel === 1 ? "var(--red)" : alertLevel >= 2 ? "var(--amber)" : "var(--border)";

  const cardBg = alertLevel === 1 ? "var(--red-soft)" : alertLevel >= 2 ? "var(--amber-soft)" : "var(--surface)";

  const postureText = alertLevel === 0 ? "자세 양호" : alertLevel === 1 ? "자세 이탈 감지" : "장시간 자세 이탈";

  const postureColor = alertLevel === 0 ? "var(--green)" : alertLevel === 1 ? "var(--red)" : "var(--amber)";

  return (
    <>
      {/* posture warning modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(22, 27, 38, 0.42)",
            backdropFilter: "blur(3px)",
            animation: "vpm-fade 0.2s ease",
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "var(--r-xl)",
              boxShadow: "var(--sh-lg)",
              padding: 36,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              maxWidth: 360,
              width: "90vw",
              animation: "vpm-pop 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "var(--amber-soft)",
                color: "var(--amber)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AlertTriangleIcon size={26} />
            </div>

            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)" }}>
              자세 경고
            </h2>

            <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-2)", textAlign: "center", lineHeight: 1.65 }}>
              15초 이상 자세가 틀어진 상태입니다.
              <br />
              잠시 스트레칭 후 바른 자세로 앉아주세요.
            </p>

            <button
              onClick={closeModal}
              style={{
                marginTop: 4,
                width: "100%",
                height: 48,
                background: "var(--brand)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--r-md)",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--brand-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--brand)";
              }}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* camera card */}
      <div
        style={{
          background: cardBg,
          border: `1px solid ${borderColor}`,
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--sh-sm)",
          padding: 14,
          display: "flex",
          alignItems: "center",
          gap: 16,
          transition: "background 0.5s, border-color 0.5s",
        }}
      >
        {/* video preview */}
        <div
          style={{
            width: 132,
            height: 86,
            borderRadius: 10,
            overflow: "hidden",
            flexShrink: 0,
            border: "1px solid var(--border)",
            background: "#0b121b",
          }}
        >
          {status === "active" ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <CameraIcon />
            </div>
          )}
        </div>

        {/* status info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-3)" }}>
            <CameraIcon size={15} />
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-2)",
              }}
            >
              Real-time Vision
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 7 }}>
            <span
              style={{
                position: "relative",
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: status === "active" ? "var(--green)" : "var(--text-4)",
                flexShrink: 0,
              }}
              className={status === "active" ? "vpm-dot-live" : ""}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
              {status === "active" ? "카메라 활성" : "시스템 대기 중"}
            </span>
            {isMonitoring && (
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: postureColor,
                  marginLeft: 6,
                }}
              >
                · {postureText}
              </span>
            )}
          </div>

          {isCalibrating && (
            <div style={{ marginTop: 9, maxWidth: 220 }}>
              <div
                style={{
                  height: 5,
                  borderRadius: 99,
                  background: "var(--brand-soft)",
                  border: "1px solid var(--border)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${calibProgress}%`,
                    height: "100%",
                    background: "var(--brand)",
                    transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              </div>
              <p
                style={{
                  margin: "5px 0 0",
                  fontSize: 11.5,
                  color: "var(--text-3)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                캘리브레이션 {calibProgress}/100
              </p>
            </div>
          )}

          {postureStatus === "calibrated" && (
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--green)", fontWeight: 600 }}>캘리브레이션 완료</p>
          )}
        </div>

        {/* PiP button */}
        <button
          onClick={openPip}
          style={{
            flexShrink: 0,
            height: 38,
            padding: "0 14px",
            background: "var(--surface)",
            color: "var(--text-2)",
            border: "1px solid var(--border-strong)",
            borderRadius: "var(--r-md)",
            fontSize: 13.5,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 7,
            whiteSpace: "nowrap",
            fontFamily: "inherit",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--surface-2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--surface)";
          }}
        >
          <PipIcon /> 미니 화면
        </button>
      </div>
    </>
  );
};

function CameraIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 8.5l4.5-2.3v11.6L16 15.5" />
      <rect x="2.5" y="5.5" width="13.5" height="13" rx="2.5" />
    </svg>
  );
}

function PipIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <rect x="12" y="11" width="7" height="6" rx="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function AlertTriangleIcon({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l9.5 16.5H2.5z" />
      <line x1="12" y1="10" x2="12" y2="14" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" />
    </svg>
  );
}
