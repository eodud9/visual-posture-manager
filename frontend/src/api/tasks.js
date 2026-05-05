import { apiPost, apiPatch, apiDelete } from './client';

export const createTask = (title) => apiPost('/api/tasks', { title });

export const updateTask = (taskId, title) => apiPatch(`/api/tasks/${taskId}`, { title });

export const deleteTask = (taskId) => apiDelete(`/api/tasks/${taskId}`);
