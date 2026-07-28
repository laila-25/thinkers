import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';
import AuthContext from './auth-context';

async function authRequest(url, options = {}) {
  const { body, ...config } = options;
  const data = typeof body === 'string' ? JSON.parse(body) : body;

  return api.request({
    url,
    timeout: 6000,
    ...config,
    data,
  });
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
