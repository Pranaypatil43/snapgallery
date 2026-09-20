import axios from 'axios';

const rawBaseURL = import.meta.env.VITE_API_URL;
let defaultBaseURL;

if (!rawBaseURL) {
  defaultBaseURL = import.meta.env.PROD ? 'https://snapgallery-4jqc.onrender.com/api' : '/api';
} else {
  const cleaned = rawBaseURL.trim().replace(/\/+$/, '');
  defaultBaseURL = cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
}

const api = axios.create({
  baseURL: defaultBaseURL,
  timeout: 30000,
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Clear stale auth and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
