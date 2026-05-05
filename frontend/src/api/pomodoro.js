import { apiGet } from './client';

export const getPomodoroPresets = () => apiGet('/api/pomodoro-presets');
