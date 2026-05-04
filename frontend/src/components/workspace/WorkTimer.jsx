import React, { useEffect, useState } from "react";

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

export const WorkTimer = ({ timeLeft, setTimeLeft, isRunning, setIsRunning }) => {
  const [selectedTime, setSelectedTime] = useState("25:00");
  const [session, setSession] = useState(1);
  const [currentSession, setCurrentSession] = useState(1);
  const [allDone, setAllDone] = useState(false);

  const handleSessionChange = (e) => {
    setSession(Number(e.target.value));
    setCurrentSession(1);
    setTimeLeft(parseTime(selectedTime));
    setIsRunning(false);
    setAllDone(false);
  };

  const handleTimeChange = (e) => {
    setSelectedTime(e.target.value);
    setCurrentSession(1);
    setTimeLeft(parseTime(e.target.value));
    setIsRunning(false);
    setAllDone(false);
  };

  // 타이머 틱
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // timeLeft === 0 도달 시 세션 진행 처리
  useEffect(() => {
    if (!isRunning || timeLeft !== 0) return;
    if (currentSession < session) {
      setCurrentSession((c) => c + 1);
      setTimeLeft(parseTime(selectedTime));
    } else {
      setIsRunning(false);
      setAllDone(true);
    }
  }, [timeLeft, isRunning, currentSession, session, selectedTime, setTimeLeft, setIsRunning]);

  const handleStart = () => {
    if (allDone) {
      setCurrentSession(1);
      setTimeLeft(parseTime(selectedTime));
      setAllDone(false);
      setIsRunning(true);
      return;
    }
    if (timeLeft === 0) {
      setTimeLeft(parseTime(selectedTime));
    }
    setIsRunning((prev) => !prev);
  };

  return (
    <div className="bg-white border border-gray-300 p-10 mt-5 rounded-lg shadow-sm flex flex-col items-center">
      <div className="flex gap-1.5 justify-end w-full">
        <select
          name="session"
          id="session"
          className="bg-[#F1F5F9] px-2 py-1 rounded text-sm"
          onChange={handleSessionChange}
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
        </select>
        <select name="time" id="time" className="bg-[#F1F5F9] px-2 py-1 rounded text-sm" onChange={handleTimeChange}>
          <option value="25:00">25:00</option>
          <option value="50:00">50:00</option>
          <option value="75:00">75:00</option>
        </select>
      </div>
      <div className="flex flex-col items-center py-10">
        <p className="font-extrabold text-8xl">{formatTime(timeLeft)}</p>
        <p className="text-gray-500 font-light text-sm mt-5 mb-3">
          {allDone ? "완료" : isRunning ? "RUNNING" : "READY"}
        </p>
        <p className="text-gray-500 font-light text-sm">
          {currentSession} / {session} SESSION{session > 1 ? "S" : ""}
        </p>
      </div>
      {allDone && (
        <p className="text-green-500 text-sm font-medium mb-4">모든 세션이 완료되었습니다!</p>
      )}
      <div>
        <button className="bg-[#2663EB] px-5 py-3 rounded-lg w-50 text-white font-bold transition-colors duration-200 hover:bg-blue-700 cursor-pointer" onClick={handleStart}>
          {isRunning ? "일시 정지" : allDone ? "다시 시작" : "집중 시작"}
        </button>
      </div>
    </div>
  );
};
