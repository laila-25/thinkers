import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    Accept: 'application/json',
  },
  withCredentials: true,
  withXSRFToken: true,
  timeout: 10000,
});

api.interceptors.request.use(config => {
  config.headers['Accept-Language'] = window.localStorage.getItem('thinkers-language') === 'ar' ? 'ar' : 'en';
  return config;
});

export const apiUrl = path => {
  const baseURL = api.defaults.baseURL?.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return baseURL ? `${baseURL}${normalizedPath}` : normalizedPath;
};

export default api;
