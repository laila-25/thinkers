import { useCallback, useEffect, useState } from 'react';
import AuthContext from './auth-context';

const cookieValue = name => document.cookie
  .split('; ')
  .find(cookie => cookie.startsWith(`${name}=`))
  ?.slice(name.length + 1);

async function authRequest(url, options = {}) {
  const timeoutController = new AbortController();
  const timeoutId = window.setTimeout(() => timeoutController.abort(), 6000);
  const signal = options.signal && typeof AbortSignal.any === 'function'
    ? AbortSignal.any([options.signal, timeoutController.signal])
    : timeoutController.signal;
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  headers.set('Accept-Language', window.localStorage.getItem('thinkers-language') === 'ar' ? 'ar' : 'en');

  const csrfToken = cookieValue('XSRF-TOKEN');
  if (csrfToken) headers.set('X-XSRF-TOKEN', decodeURIComponent(csrfToken));
  if (options.body) headers.set('Content-Type', 'application/json');

  let response;
  try {
    response = await fetch(url, { ...options, signal, headers, credentials: 'include' });
  } finally {
    window.clearTimeout(timeoutId);
  }
  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || `Request failed with status ${response.status}`);
    error.response = { status: response.status, data };
    throw error;
  }

  return { data };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await authRequest('/api/user');
      setUser(data);
    } catch (error) {
      if (error.response?.status !== 401) {
        throw error;
      }

      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser().catch(() => setIsLoading(false));
  }, [fetchUser]);

  const initializeCsrf = async () => {
    return authRequest('/sanctum/csrf-cookie');
  };

  const postWithFreshCsrf = async (url, payload) => {
    await initializeCsrf();

    try {
      return await authRequest(url, { method: 'POST', body: JSON.stringify(payload) });
    } catch (error) {
      if (error.response?.status !== 419) throw error;

      await initializeCsrf();
      return authRequest(url, { method: 'POST', body: JSON.stringify(payload) });
    }
  };

  const login = async credentials => {
    const { data } = await postWithFreshCsrf('/api/login', credentials);
    await authRequest('/api/csrf-cookie');
    setUser(data.user);
    return data.user;
  };

  const register = async registration => {
    const { data } = await postWithFreshCsrf('/api/register', registration);
    await authRequest('/api/csrf-cookie');
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await initializeCsrf();
    await authRequest('/api/logout', { method: 'POST' });
    setUser(null);
  };

  const resendVerification = async () => {
    const { data } = await postWithFreshCsrf('/api/email/verification-notification');
    return data;
  };

  const verifyEmail = async verificationPath => {
    const { data } = await authRequest(verificationPath);
    await fetchUser();
    return data;
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    resendVerification,
    verifyEmail,
    refreshUser: fetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
