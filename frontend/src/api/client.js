import axios from 'axios';

const api = axios.create({
  baseURL: '',
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
  return path.startsWith('/') ? path : `/${path}`;
};

export default api;
