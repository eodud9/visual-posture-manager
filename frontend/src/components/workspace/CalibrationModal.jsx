import React, { useEffect, useRef, useState } from "react";

export const CalibrationModal = ({ open, stream, calibProgress, calibrationPhase, setCalibrationPhase, onClose }) => {
  const videoRef = useRef(null);

  const [visible, setVisible] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setShow(true));
      });
    } else {
      setShow(false);
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!visible) return;
    const video = videoRef.current;
    if (!stream || !video) return;

    if (video.srcObject !== stream) video.srcObject = stream;

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

  const calibrating = calibrationPhase === "calibrating";

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
          width: 630,
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
          자세 캘리브레이션
        </h2>
        <p
          style={{
            margin: "8px 0 20px",
            fontSize: 13,
            color: "var(--text-3)",
            textAlign: "center",
          }}
        >
          어깨와 머리가 가이드라인 안에 들어오도록 앉아주세요
        </p>

        {/* camera with pose guideline overlay */}
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16/10",
            borderRadius: "var(--r-lg)",
            overflow: "hidden",
            border: "1px solid var(--border)",
            background: "#0b121b",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          {/* pose guideline overlay */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <svg viewBox="0 0 200 140" style={{ width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid meet">
              <path
                d="M 100 6 C 70 6, 58 28, 58 52 C 58 72, 68 84, 82 88 C 76 90, 60 92, 44 100 C 28 108, 10 116, 6 140 M 194 140 C 190 116, 172 108, 156 100 C 140 92, 124 90, 118 88 C 132 84, 142 72, 142 52 C 142 28, 130 6, 100 6"
                fill="none"
                stroke="rgba(255,255,255,0.85)"
                strokeWidth="0.8"
                strokeDasharray="6 4"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </div>
          {/* corner brackets */}
          {[
            { top: 10, left: 10 },
            { top: 10, right: 10 },
            { bottom: 10, left: 10 },
            { bottom: 10, right: 10 },
          ].map((pos, i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                width: 18,
                height: 18,
                borderTop: pos.top != null ? "2px solid rgba(127,240,182,0.8)" : "none",
                borderBottom: pos.bottom != null ? "2px solid rgba(127,240,182,0.8)" : "none",
                borderLeft: pos.left != null ? "2px solid rgba(127,240,182,0.8)" : "none",
                borderRight: pos.right != null ? "2px solid rgba(127,240,182,0.8)" : "none",
                ...pos,
              }}
            />
          ))}
        </div>

        {calibrating ? (
          <div style={{ marginTop: 20 }}>
            <div
              style={{
                height: 8,
                borderRadius: 99,
                background: "var(--brand-soft)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${calibProgress}%`,
                  height: "100%",
                  background: "var(--brand)",
                  transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  borderRadius: 99,
                }}
              />
            </div>
            <p
              style={{
                textAlign: "center",
                margin: "10px 0 0",
                fontSize: 13,
                fontWeight: 700,
                color: "var(--brand)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {calibProgress}%
            </p>
            <p style={{ textAlign: "center", margin: "16px 0 0" }}>
              <button
                onClick={onClose}
                style={{
                  height: 38,
                  padding: "0 18px",
                  background: "var(--surface-2)",
                  color: "var(--text-2)",
                  border: "none",
                  borderRadius: "var(--r-md)",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f1f2f5";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--surface-2)";
                }}
              >
                취소
              </button>
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <button
              onClick={handleStartCalibration}
              style={{
                flex: 1,
                height: 50,
                background: "var(--brand)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--r-md)",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
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
              <TargetIcon /> 캘리브레이션 시작
            </button>
            <button
              onClick={onClose}
              style={{
                height: 50,
                padding: "0 18px",
                background: "var(--surface-2)",
                color: "var(--text-2)",
                border: "none",
                borderRadius: "var(--r-md)",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f1f2f5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--surface-2)";
              }}
            >
              취소
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

function TargetIcon() {
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
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </svg>
  );
}
