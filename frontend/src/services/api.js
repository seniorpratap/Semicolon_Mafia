/**
 * API Service Layer
 * =================
 * Pre-configured Axios client for communicating with the FastAPI backend.
 * Vite proxy forwards /api/* to http://localhost:8000
 */

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Text Analysis ───────────────────────────────────────
export const analyzeText = async (text, context = '') => {
  const { data } = await api.post('/analyze-text', { text, context });
  return data.result;
};

// ─── Image Analysis ──────────────────────────────────────
export const analyzeImage = async (file, prompt = 'Analyze this image in detail.') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('prompt', prompt);
  
  const { data } = await api.post('/analyze-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.result;
};

// ─── Chat ────────────────────────────────────────────────
export const chatWithAI = async (message, history = []) => {
  const { data } = await api.post('/chat', { message, history });
  return data.response;
};

// ─── Prediction ──────────────────────────────────────────
export const predict = async (features) => {
  const { data } = await api.post('/predict', { features });
  return data.prediction;
};

// ─── File Upload ─────────────────────────────────────────
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const { data } = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

// ─── Health Check ────────────────────────────────────────
export const checkHealth = async () => {
  const { data } = await api.get('/health');
  return data;
};

export default api;
