import { useEffect, useRef, useState } from "react";

/**
 * 웹캠 스트림 초기화 및 정리
 * @param {React.RefObject} videoRef - video 엘리먼트 ref
 * @returns {{ status: 'idle'|'active'|'error' }}
 */
export const useCamera = (videoRef) => {
  const streamRef = useRef(null);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatus("active");
      })
      .catch(() => setStatus("error"));

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [videoRef]);

  return { status };
};
