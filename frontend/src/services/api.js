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

  // Authentication endpoints
  register: (data) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  login: (credentials) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),

  getMe: () => request('/auth/me'),
};
