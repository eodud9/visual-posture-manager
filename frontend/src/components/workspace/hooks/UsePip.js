import { useEffect, useRef } from "react";

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

/**
 * Document Picture-in-Picture 창 관리
 * - 창 열기
 * - 타이머 텍스트 실시간 동기화
 * - alertLevel 변화에 따른 배경색 동기화
 *
 * @param {number} timeLeft - 남은 시간 (초)
 * @param {string} pipBgColor - 현재 경고 단계의 배경색 (hex)
 * @param {() => void} onClose - PiP 창 닫힐 때 콜백
 * @returns {{ openPip: () => Promise<void> }}
 */
export const usePip = (timeLeft, pipBgColor, alertLevel, onClose) => {
  const pipWindowRef = useRef(null);

  // 타이머 텍스트 동기화
  useEffect(() => {
    if (!pipWindowRef.current) return;
    const timerEl = pipWindowRef.current.document.getElementById("pip-timer");
    if (timerEl) timerEl.textContent = formatTime(timeLeft);
  }, [timeLeft]);

  // 배경색 + 메시지 동기화
  useEffect(() => {
    if (!pipWindowRef.current) return;
    pipWindowRef.current.document.body.style.background = pipBgColor;

    const msgEl = pipWindowRef.current.document.getElementById("pip-msg");
    if (!msgEl) return;

    if (alertLevel === 0) {
      msgEl.textContent = "";
    } else if (alertLevel === 1) {
      msgEl.textContent = "⚠️ 자세를 바르게 해주세요";
    } else if (alertLevel === 2) {
      msgEl.textContent = "🚨 장시간 자세 이탈 중";
    } else if (alertLevel === 3) {
      msgEl.textContent = "🚨 지금 바로 스트레칭하세요!";
    }
  }, [pipBgColor, alertLevel]);

  const openPip = async () => {
    if (!("documentPictureInPicture" in window)) {
      alert("지원하지 않는 브라우저입니다");
      return;
    }

    const pipWindow = await documentPictureInPicture.requestWindow({ width: 300, height: 200 });
    pipWindowRef.current = pipWindow;

    pipWindow.addEventListener("pagehide", () => {
      pipWindowRef.current = null;
      onClose?.();
    });

    pipWindow.document.body.style.cssText = `
      margin: 0;
      height: 100vh;
      background: ${pipBgColor};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: sans-serif;
      color: white;
      transition: background 0.6s ease;
    `;

    const label = pipWindow.document.createElement("p");
    label.textContent = "FOCUS TIMER";
    label.style.cssText = "font-size:11px; letter-spacing:3px; color:#94a3b8; margin:0 0 14px;";

    const timer = pipWindow.document.createElement("p");
    timer.id = "pip-timer";
    timer.textContent = formatTime(timeLeft);
    timer.style.cssText = "font-size:64px; font-weight:800; margin:0; line-height:1; letter-spacing:-2px;";

    const msg = pipWindow.document.createElement("p");
    msg.id = "pip-msg";
    msg.textContent = "";
    msg.style.cssText = "font-size:13px; font-weight:600; margin:14px 0 0; letter-spacing:0.5px;";

    pipWindow.document.body.appendChild(label);
    pipWindow.document.body.appendChild(timer);
    pipWindow.document.body.appendChild(msg);
  };

  return { openPip };
};
