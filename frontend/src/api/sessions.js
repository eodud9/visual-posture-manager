import { apiPost, apiPatch, apiGet } from "./client";

export const startSession = (data) => apiPost("/api/sessions", data);

export const pauseSession = (sessionId) => apiPatch(`/api/sessions/${sessionId}/pause`, {});

export const resumeSession = (sessionId) => apiPatch(`/api/sessions/${sessionId}/resume`, {});

export const endSession = (sessionId) => apiPatch(`/api/sessions/${sessionId}/end`, {});

export const batchPostureLogs = (sessionId, logs) => apiPost(`/api/sessions/${sessionId}/posture-logs/batch`, logs);

export const saveDeviationSegment = (sessionId, segment) =>
  apiPost(`/api/sessions/${sessionId}/deviation-segments`, segment);

export const saveAlert = (sessionId, alert) => apiPost(`/api/sessions/${sessionId}/alerts`, alert);

export const saveFeedback = (sessionId, feedback) => apiPost(`/api/sessions/${sessionId}/feedback`, feedback);

export const getSessionReport = (sessionId) => apiGet(`/api/sessions/${sessionId}/report`);
