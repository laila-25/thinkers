import axios from 'axios';

// In development, keep every request on the Vite origin and let its proxy
// forward API traffic to Laravel. Sanctum authentication is cookie based, so
// mixing localhost:5173 with direct localhost/127.0.0.1:8000 requests can
// create separate cookie jars and produce misleading 401 responses.
const defaultApiUrl = typeof window === 'undefined' ? 'http://localhost:8000' : '';
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

const api = axios.create({
  // Always use the same-origin Vite proxy during development, even if an old
  // VITE_API_URL remains in a developer's machine environment.
  baseURL: import.meta.env.DEV ? defaultApiUrl : (configuredApiUrl || defaultApiUrl),
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

export default api;
