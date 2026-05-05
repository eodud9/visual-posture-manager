import { apiPost, apiGet } from './client';

export const saveCalibration = (data) => apiPost('/api/calibrations', data);

export const getLatestCalibration = () => apiGet('/api/calibrations/latest');
