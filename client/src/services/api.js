import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Health check
export const checkHealth = () => api.get('/health');

// Invoice endpoints
export const uploadCSV = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return axios.post(`${API_BASE}/invoices/upload`, formData, {
    onUploadProgress: (progressEvent) => {
      const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      return percent;
    }
  });
};

export const getInvoices = () => api.get('/invoices');
export const clearInvoices = () => api.delete('/invoices/clear');

// AI endpoints
export const generateEmail = (invoice) => api.post('/ai/generate-email', { invoice });
export const generateBatchEmails = (invoices) => api.post('/ai/generate-batch', { invoices });
export const generateInsights = (invoices) => api.post('/ai/insights', { invoices });

// Analytics
export const getAnalytics = (invoices) => api.post('/analytics/overview', { invoices });

// Audit
export const getAuditLogs = (limit = 100, offset = 0) =>
  api.get(`/audit?limit=${limit}&offset=${offset}`);
export const exportAuditCSV = () =>
  api.get('/audit/export', { responseType: 'blob' });
export const clearAuditLogs = () => api.delete('/audit/clear');

export default api;
