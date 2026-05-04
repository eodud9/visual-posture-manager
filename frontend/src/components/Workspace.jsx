import React, { useState } from "react";
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

  return (
    <div className="p-10 w-full">
      <WorkHeader />
      <WorkTimer
        timeLeft={timeLeft}
        setTimeLeft={setTimeLeft}
        isRunning={isRunning}
        setIsRunning={setIsRunning}
      />
      <WorkCam
        timeLeft={timeLeft}
        isRunning={isRunning}
        setIsRunning={setIsRunning}
      />
    </div>
  );
};
