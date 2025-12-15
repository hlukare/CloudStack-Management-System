import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  updatePreferences: (preferences) => api.patch('/auth/preferences', { preferences }),
  changePassword: (data) => api.patch('/auth/change-password', data),
  updateProfile: (data) => api.patch('/auth/profile', data),
  uploadProfilePicture: (formData) => api.post('/auth/profile-picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  removeProfilePicture: () => api.delete('/auth/profile-picture'),
};

// VM API
export const vmAPI = {
  list: (params) => api.get('/vms', { params }),
  get: (id) => api.get(`/vms/${id}`),
  sync: (provider, region) => api.post('/vms/sync', { provider, region }),
  addByInstanceId: (data) => api.post('/vms/add-by-id', data),
  refresh: (id) => api.post(`/vms/${id}/refresh`),
  start: (id) => api.post(`/vms/${id}/start`),
  stop: (id) => api.post(`/vms/${id}/stop`),
  restart: (id) => api.post(`/vms/${id}/restart`),
  update: (id, data) => api.patch(`/vms/${id}`, data),
  delete: (id) => api.delete(`/vms/${id}`),
  getMetrics: (id, hours) => api.get(`/vms/${id}/metrics`, { params: { hours } }),
};

// Snapshot API
export const snapshotAPI = {
  list: (params) => api.get('/snapshots', { params }),
  get: (id) => api.get(`/snapshots/${id}`),
  create: (data) => api.post('/snapshots', data),
  delete: (id) => api.delete(`/snapshots/${id}`),
  getStats: () => api.get('/snapshots/stats/summary'),
};

// Monitoring API
export const monitoringAPI = {
  getDashboard: () => api.get('/monitoring/dashboard'),
  getRealtime: (id) => api.get(`/monitoring/vm/${id}/realtime`),
  getHistory: (id, hours, metric) => api.get(`/monitoring/vm/${id}/history`, { params: { hours, metric } }),
  getHealthSummary: () => api.get('/monitoring/health/summary'),
};

// Cost API
export const costAPI = {
  getSummary: (days) => api.get('/costs/summary', { params: { days } }),
  getDetailed: (startDate, endDate) => api.get('/costs/detailed', { params: { startDate, endDate } }),
  getOptimizations: () => api.get('/costs/optimizations'),
  fetchAWS: () => api.post('/costs/fetch/aws'),
  fetchAzure: () => api.post('/costs/fetch/azure'),
  fetchGCP: () => api.post('/costs/fetch/gcp'),
  getForecast: () => api.get('/costs/forecast'),
};

// Alert API
export const alertAPI = {
  list: (params) => api.get('/alerts', { params }),
  get: (id) => api.get(`/alerts/${id}`),
  getCounts: () => api.get('/alerts/counts'),
  acknowledge: (id) => api.post(`/alerts/${id}/acknowledge`),
  resolve: (id, notes) => api.post(`/alerts/${id}/resolve`, { notes }),
  bulkUpdate: (alertIds, action) => api.post('/alerts/bulk/update', { alertIds, action }),
  cleanup: (days) => api.delete('/alerts/cleanup', { params: { days } }),
};

// Analytics API
export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getUtilizationTrends: (days) => api.get('/analytics/utilization-trends', { params: { days } }),
  getCostTrends: (days) => api.get('/analytics/cost-trends', { params: { days } }),
  predictResources: (vmId) => api.post('/analytics/predict/resources', { vmId }),
  detectAnomalies: (vmId, days) => api.post('/analytics/detect/anomalies', { vmId, days }),
  getPerformanceInsights: () => api.get('/analytics/insights/performance'),
};

// Automation API
export const automationAPI = {
  list: () => api.get('/automation'),
  get: (id) => api.get(`/automation/${id}`),
  create: (data) => api.post('/automation', data),
  update: (id, data) => api.patch(`/automation/${id}`, data),
  delete: (id) => api.delete(`/automation/${id}`),
  toggle: (id) => api.post(`/automation/${id}/toggle`),
  execute: (id) => api.post(`/automation/${id}/execute`),
  getHistory: (id) => api.get(`/automation/${id}/history`),
};

export default api;
