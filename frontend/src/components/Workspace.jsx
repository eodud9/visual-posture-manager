import React, { useEffect, useState } from "react";
import { WorkHeader } from "./workspace/WorkHeader";
import { WorkTimer } from "./workspace/WorkTimer";
import { WorkCam } from "./workspace/WorkCam";

const parseTime = (timeStr) => {
  const [m, s] = timeStr.split(":").map(Number);
  return m * 60 + s;
};

export const Workspace = () => {
  const [timeLeft, setTimeLeft] = useState(parseTime("25:00"));
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [calibrationPhase, setCalibrationPhase] = useState("idle"); // 'idle' | 'calibrating' | 'running'

  const onStartRequest = () => setCalibrationPhase("calibrating");

  // 캘리브레이션 완료 시 타이머 자동 시작
  useEffect(() => {
    if (calibrationPhase === "running") setIsRunning(true);
  }, [calibrationPhase]);

  return (
    <div className="p-10 w-full">
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
        timeLeft={timeLeft}
        isRunning={isRunning}
        setIsRunning={setIsRunning}
        sessionId={sessionId}
        calibrationPhase={calibrationPhase}
        setCalibrationPhase={setCalibrationPhase}
      />
    </div>
  );
};
