// api.js — centralized API service layer
// All backend communication goes through this file

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('parahist_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.message || data.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  health:          ()      => request('/health'),
  getSystem:       ()      => request('/system'),
  getDataset:      ()      => request('/dataset'),
  getHistogram:    ()      => request('/histogram'),
  getBenchmark:    ()      => request('/benchmark'),

  runHistogram: (threads)  => request('/histogram/run', {
    method: 'POST',
    body: JSON.stringify({ threads }),
  }),

  runBenchmark: (maxThreads = 16) => request('/benchmark', {
    method: 'POST',
    body: JSON.stringify({ maxThreads }),
  }),

  // Authentication & Account endpoints
  register: (data) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  login: (credentials) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),

  getMe:          () => request('/auth/me'),
  getCurrentUser: () => request('/auth/me'),

  updateProfile: (data) => request('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  changePassword: (data) => request('/auth/password', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  getPreferences: () => request('/auth/preferences'),

  updatePreferences: (preferences) => request('/auth/preferences', {
    method: 'PUT',
    body: JSON.stringify(preferences),
  }),

  // PDF Report Download
  downloadPdfReport: async (customMetrics = {}) => {
    const token = localStorage.getItem('parahist_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${BASE_URL}/report/pdf`, {
      method: 'POST',
      headers,
      body: JSON.stringify(customMetrics),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || errJson.message || 'Unable to generate report. Please try again.');
    }

    const blob = await res.blob();
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `ParaHist_Experiment_Report_${dateStr}.pdf`;

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return { success: true, filename };
  },

  // PostgreSQL Experiment History
  getExperiments: () => request('/experiments'),
  getExperimentDetails: (id) => request(`/experiments/${id}`),
};
