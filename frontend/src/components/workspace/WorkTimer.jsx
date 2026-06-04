import React, { useEffect, useRef, useState } from "react";
import { startSession, endSession, pauseSession, resumeSession } from "../../api/sessions";
import { useNavigate } from "react-router-dom";

const DEFAULT_SESSION_COUNTS = [1, 2, 3];
const DEFAULT_DURATIONS = ["10:00", "25:00", "50:00", "75:00"];

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const parseTime = (timeStr) => {
  const [m, s] = timeStr.split(":").map(Number);
  return m * 60 + s;
};

/* Circular progress ring */
function ProgressRing({ progress, timeLeft, statusLabel, statusColor }) {
  const R = 110;
  const C = 2 * Math.PI * R;
  const off = C * (1 - Math.max(0, Math.min(1, progress)));

  return (
    <div style={{ position: "relative", width: 248, height: 248 }}>
      <svg width="248" height="248" viewBox="0 0 248 248" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="124" cy="124" r={R} fill="none" stroke="#eceef3" strokeWidth="10" />
        <circle
          cx="124"
          cy="124"
          r={R}
          fill="none"
          stroke="var(--brand)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.9s linear" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: 60,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            color: "var(--text)",
          }}
        >
          {formatTime(timeLeft)}
        </span>
        <span
          style={{
            marginTop: 12,
            fontSize: 12.5,
            fontWeight: 600,
            color: statusColor,
            letterSpacing: "0.01em",
            whiteSpace: "nowrap",
          }}
        >
          {statusLabel}
        </span>
      </div>
    </div>
  );
}

export const WorkTimer = ({
  timeLeft,
  setTimeLeft,
  isRunning,
  setIsRunning,
  sessionId,
  setSessionId,
  calibrationPhase,
  setCalibrationPhase,
  onStartRequest,
  calibrationId,
}) => {
  const navigate = useNavigate();
  const [sessionCounts] = useState(DEFAULT_SESSION_COUNTS);
  const [durations] = useState(DEFAULT_DURATIONS);
  const [selectedTime, setSelectedTime] = useState("25:00");
  const [session, setSession] = useState(1);
  const [currentSession, setCurrentSession] = useState(1);
  const [allDone, setAllDone] = useState(false);
  const [completedSession, setCompletedSession] = useState(null);
  const [waitingNextSession, setWaitingNextSession] = useState(false);
  const sessionCreatingRef = useRef(false);

  const resetConfig = () => {
    setCurrentSession(1);
    setIsRunning(false);
    setAllDone(false);
    setCompletedSession(null);
    setWaitingNextSession(false);
    setCalibrationPhase("idle");
    sessionCreatingRef.current = false;
  };

  const handleSessionChange = (e) => {
    setSession(Number(e.target.value));
    setTimeLeft(parseTime(selectedTime));
    resetConfig();
  };

  const handleTimeChange = (e) => {
    setSelectedTime(e.target.value);
    setTimeLeft(parseTime(e.target.value));
    resetConfig();
  };

  useEffect(() => {
    if (calibrationPhase !== "running" || sessionCreatingRef.current) return;
    sessionCreatingRef.current = true;
    startSession({
      focusMinutes: Math.round(parseTime(selectedTime) / 60),
      breakMinutes: 5,
      calibrationId: calibrationId ?? undefined,
    }).then((res) => {
      if (res?.sessionId) setSessionId(res.sessionId);
      else sessionCreatingRef.current = false;
    });
  }, [calibrationPhase]);

  useEffect(() => {
    if (!isRunning || calibrationPhase !== "running") return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (currentSession < session) {
            setIsRunning(false);
            setCompletedSession(currentSession);
            setWaitingNextSession(true);
            return 0;
          } else {
            setIsRunning(false);
            setAllDone(true);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, calibrationPhase, currentSession, session, selectedTime]);

  useEffect(() => {
    if (!allDone) return;
    sessionCreatingRef.current = false;
    setCalibrationPhase("idle");
    if (sessionId) {
      endSession(sessionId).then(() => navigate("/report", { state: { sessionId } }));
    }
  }, [allDone]);

  const handleStart = () => {
    if (waitingNextSession) {
      setCurrentSession((c) => c + 1);
      setTimeLeft(parseTime(selectedTime));
      setWaitingNextSession(false);
      setCompletedSession(null);
      setIsRunning(true);
      return;
    }

    if (allDone) {
      setCurrentSession(1);
      setTimeLeft(parseTime(selectedTime));
      setAllDone(false);
      onStartRequest();
      return;
    }

    if (calibrationPhase === "calibrating") return;

    if (calibrationPhase === "running") {
      const next = !isRunning;
      setIsRunning(next);
      if (sessionId) {
        if (next) resumeSession(sessionId);
        else pauseSession(sessionId);
      }
      return;
    }

    if (timeLeft === 0) setTimeLeft(parseTime(selectedTime));
    onStartRequest();
  };

  const total = parseTime(selectedTime);
  const progress = calibrationPhase !== "idle" ? 1 - timeLeft / total : 0;

  const statusLabel = allDone
    ? "완료"
    : waitingNextSession
      ? `${currentSession}세션 완료 — 다음 세션을 시작하세요`
      : completedSession !== null
        ? `${completedSession + 1} 세션 시작!`
        : isRunning
          ? "집중하는 중"
          : calibrationPhase === "calibrating"
            ? "분석 준비 중"
            : "준비 완료";

  const statusColor = allDone || waitingNextSession
    ? "var(--green)"
    : completedSession !== null
      ? "var(--brand)"
      : isRunning
        ? "var(--green)"
        : calibrationPhase === "calibrating"
          ? "var(--text-3)"
          : "var(--text-3)";

  const isActive = calibrationPhase === "running" || calibrationPhase === "calibrating";

  const btnLabel = isRunning
    ? "일시 정지"
    : allDone
      ? "다시 시작"
      : waitingNextSession
        ? "다음 세션 시작"
        : calibrationPhase === "calibrating"
          ? "캘리브레이션 중..."
          : "세션 시작";

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--sh-sm)",
        padding: "26px 28px 30px",
      }}
    >
      {/* config row */}
      <div style={{ display: "flex", gap: 16, justifyContent: "flex-end" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", whiteSpace: "nowrap" }}>세션 수</span>
          <select
            name="session"
            className="bg-[#F1F5F9] px-2 py-1 rounded text-sm"
            disabled={isActive}
            onChange={handleSessionChange}
            style={{
              appearance: "none",
              height: 32,
              padding: "0 28px 0 11px",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--r-sm)",
              background: `var(--surface) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b93a3' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 9px center`,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text)",
              cursor: "pointer",
              outline: "none",
              fontFamily: "inherit",
              opacity: isActive ? 0.5 : 1,
            }}
          >
            {sessionCounts.map((count) => (
              <option key={count} value={count}>{count}회</option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", whiteSpace: "nowrap" }}>집중 시간</span>
          <select
            name="time"
            disabled={isActive}
            onChange={handleTimeChange}
            style={{
              appearance: "none",
              height: 32,
              padding: "0 28px 0 11px",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--r-sm)",
              background: `var(--surface) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b93a3' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 9px center`,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text)",
              cursor: "pointer",
              outline: "none",
              fontFamily: "inherit",
              opacity: isActive ? 0.5 : 1,
            }}
          >
            {durations.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>
      </div>

      {/* progress ring */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 6 }}>
        <ProgressRing
          progress={progress}
          timeLeft={timeLeft}
          statusLabel={statusLabel}
          statusColor={statusColor}
        />
        <p
          style={{
            margin: "14px 0 0",
            fontSize: 12.5,
            fontWeight: 600,
            color: "var(--text-3)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          세션 {currentSession} / {session}
        </p>
      </div>

      {allDone && (
        <p style={{ textAlign: "center", color: "var(--green)", fontSize: 13, fontWeight: 600, margin: "8px 0 0" }}>
          모든 세션이 완료되었습니다!
        </p>
      )}

      {/* controls */}
      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "center",
          marginTop: 24,
          maxWidth: 440,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <button
          onClick={handleStart}
          disabled={calibrationPhase === "calibrating"}
          style={{
            flex: 1,
            height: 50,
            background: calibrationPhase === "calibrating" ? "#d6d9e0" : "var(--brand)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--r-md)",
            fontSize: 15,
            fontWeight: 600,
            cursor: calibrationPhase === "calibrating" ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "background 0.15s",
            boxShadow: calibrationPhase === "calibrating"
              ? "none"
              : "0 1px 1px rgba(20,28,46,0.12), inset 0 1px 0 rgba(255,255,255,0.12)",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => {
            if (calibrationPhase !== "calibrating") e.currentTarget.style.background = "var(--brand-hover)";
          }}
          onMouseLeave={(e) => {
            if (calibrationPhase !== "calibrating") e.currentTarget.style.background = "var(--brand)";
          }}
        >
          {isRunning ? <PauseIcon /> : <PlayIcon />}
          {btnLabel}
        </button>

        {allDone && (
          <button
            onClick={() => navigate("/report", { state: { sessionId } })}
            style={{
              height: 50,
              padding: "0 18px",
              background: "var(--surface)",
              color: "var(--text-2)",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--r-md)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontFamily: "inherit",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface)"; }}
          >
            리포트 보기
          </button>
        )}
      </div>
    </div>
  );
};

function PlayIcon() {
  return (
    <svg width={17} height={17} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width={17} height={17} viewBox="0 0 24 24" fill="currentColor">
      <rect x="7" y="5.5" width="3.4" height="13" rx="1.2" />
      <rect x="13.6" y="5.5" width="3.4" height="13" rx="1.2" />
    </svg>
  );
}
