import { useEffect, useRef, useState, useCallback } from "react";

/**
 * 자세 이탈 지속 시간에 따른 경고 단계 계산
 * 0: 정상, 1: 5초+(빨강), 2: 30초+(노랑+경고음), 3: 3분+(모달)
 */
const getAlertLevel = (seconds) => {
  if (seconds >= 180) return 3;
  if (seconds >= 30) return 2;
  if (seconds >= 5) return 1;
  return 0;
};

/**
 * Web Audio API로 경고음 생성 (외부 파일 불필요)
 */
const playAlertSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.8);
  } catch (e) {
    console.warn("[Audio] 경고음 재생 실패:", e);
  }
};

/**
 * 자세 이탈 경고 단계 및 모달 관리
 * @param {boolean} isBadPosture - 현재 자세 이탈 여부
 * @param {string} calibrationPhase - 'idle'|'calibrating'|'running'
 * @returns {{ alertLevel: number, showModal: boolean, closeModal: () => void }}
 */
export const usePostureAlert = (isBadPosture, calibrationPhase) => {
  const badPostureSecondsRef = useRef(0);
  const badPostureTimerRef = useRef(null);
  const modalShownRef = useRef(false);

  const [alertLevel, setAlertLevel] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const closeModal = useCallback(() => setShowModal(false), []);

  // 자세 이탈 타이머 시작/중지
  useEffect(() => {
    if (isBadPosture) {
      if (badPostureTimerRef.current) return; // 중복 방지
      badPostureTimerRef.current = setInterval(() => {
        badPostureSecondsRef.current += 1;
        const level = getAlertLevel(badPostureSecondsRef.current);
        setAlertLevel(level);

        if (badPostureSecondsRef.current === 30) {
          playAlertSound();
        }
        if (badPostureSecondsRef.current === 180 && !modalShownRef.current) {
          modalShownRef.current = true;
          setShowModal(true);
          playAlertSound();
        }
      }, 1000);
    } else {
      // 자세 복구 시 초기화
      if (badPostureTimerRef.current) {
        clearInterval(badPostureTimerRef.current);
        badPostureTimerRef.current = null;
      }
      badPostureSecondsRef.current = 0;
      modalShownRef.current = false;
      setAlertLevel(0);
    }

    return () => {
      if (badPostureTimerRef.current) {
        clearInterval(badPostureTimerRef.current);
        badPostureTimerRef.current = null;
      }
    };
  }, [isBadPosture]);

  // calibrationPhase idle 시 전체 초기화
  useEffect(() => {
    if (calibrationPhase === "idle") {
      badPostureSecondsRef.current = 0;
      modalShownRef.current = false;
      setAlertLevel(0);
      setShowModal(false);
    }
  }, [calibrationPhase]);

  return { alertLevel, showModal, closeModal };
};
