import React, { useEffect, useRef, useState } from "react";
import { startSession, endSession, pauseSession, resumeSession } from "../../api/sessions";
import { useNavigate } from "react-router-dom";

const DEFAULT_SESSION_COUNTS = [1, 2, 3];
const DEFAULT_DURATIONS = ["00:05", "25:00", "50:00", "75:00"];

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const parseTime = (timeStr) => {
  const [m, s] = timeStr.split(":").map(Number);
  return m * 60 + s;
};

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
  const [sessionCounts, setSessionCounts] = useState(DEFAULT_SESSION_COUNTS);
  const [durations, setDurations] = useState(DEFAULT_DURATIONS);
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

  // 캘리브레이션 완료 후 세션 API 호출 (calibrationPhase가 "running"으로 전환될 때)
  useEffect(() => {
    if (calibrationPhase !== "running" || sessionCreatingRef.current) return;
    sessionCreatingRef.current = true;
    startSession({
      focusMinutes: Math.round(parseTime(selectedTime) / 60),
      breakMinutes: 5,
      calibrationId: calibrationId ?? undefined, // ✅ 추가
    }).then((res) => {
      if (res?.sessionId) setSessionId(res.sessionId);
      else sessionCreatingRef.current = false;
    });
  }, [calibrationPhase]);

  // 타이머 틱 — isRunning AND calibrationPhase === "running" 일 때만 동작
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

  // 모든 세션 완료 시 API 호출 및 상태 초기화
  useEffect(() => {
    if (!allDone) return;
    sessionCreatingRef.current = false;
    setCalibrationPhase("idle");
    if (sessionId) endSession(sessionId);
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

    // calibrationPhase === "idle" — 최초 시작
    if (timeLeft === 0) setTimeLeft(parseTime(selectedTime));
    onStartRequest();
  };

  // 상태 텍스트 & 색상
  const statusLabel = allDone
    ? "완료"
    : waitingNextSession
      ? `${currentSession}세션 완료 — 다음 세션을 시작하세요`
      : completedSession !== null
        ? `${completedSession + 1} 세션 시작!`
        : isRunning
          ? "RUNNING"
          : "READY";

  const statusColor =
    completedSession !== null
      ? "text-[#2663EB] font-semibold"
      : allDone || waitingNextSession
        ? "text-green-500 font-semibold"
        : "text-gray-500 font-light";

  return (
    <div className="bg-white border border-gray-200 p-10 rounded-lg shadow-sm flex flex-col items-center">
      <div className="flex gap-3 justify-end w-full items-center">
        <div className="flex items-center gap-1.5">
          <label htmlFor="session" className="text-xs text-gray-400 font-medium">
            세션
          </label>
          <select
            name="session"
            id="session"
            className="bg-[#F1F5F9] px-2 py-1 rounded text-sm"
            onChange={handleSessionChange}
          >
            {sessionCounts.map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <label htmlFor="time" className="text-xs text-gray-400 font-medium">
            시간
          </label>
          <select name="time" id="time" className="bg-[#F1F5F9] px-2 py-1 rounded text-sm" onChange={handleTimeChange}>
            {durations.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col items-center py-2">
        <p className="font-extrabold text-8xl">{formatTime(timeLeft)}</p>
        <p className={`text-sm mt-5 mb-3 transition-colors duration-300 ${statusColor}`}>{statusLabel}</p>
        <p className="text-gray-500 font-light text-sm">
          {currentSession} / {session} SESSION{session > 1 ? "S" : ""}
        </p>
      </div>

      {allDone && <p className="text-green-500 text-sm font-medium mb-4">모든 세션이 완료되었습니다!</p>}

      <div className="flex gap-3 items-center justify-center w-full">
        <button
          className="bg-[#2663EB] px-5 py-3 mt-5 rounded-lg w-1/2 text-white font-bold transition-colors duration-200 hover:bg-blue-700 cursor-pointer"
          onClick={handleStart}
        >
          {isRunning
            ? "일시 정지"
            : allDone
              ? "다시 시작"
              : waitingNextSession
                ? "다음 세션 시작"
                : calibrationPhase === "calibrating"
                  ? "캘리브레이션 중..."
                  : "세션 시작"}
        </button>

        {allDone && (
          <button
            onClick={() => navigate("/report")}
            className="bg-[#F8FAFC] px-4 py-3 rounded-lg text-sm font-bold text-[#64748B] hover:bg-gray-100 cursor-pointer"
          >
            통계 보기
          </button>
        )}
      </div>
    </div>
  );
};
