import { apiPost, apiGet } from './client';

export const saveConsents = (data) => apiPost('/api/consents', data);

export const getConsentsStatus = () => apiGet('/api/consents/status');
