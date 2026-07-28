import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';
import AuthContext from './auth-context';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await api.get('/api/user');
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
    return api.get('/sanctum/csrf-cookie');
  };

  const postWithFreshCsrf = async (url, payload) => {
    await initializeCsrf();

    try {
      return await api.post(url, payload);
    } catch (error) {
      if (error.response?.status !== 419) throw error;

      await initializeCsrf();
      return api.post(url, payload);
    }
  };

  const login = async credentials => {
    const { data } = await postWithFreshCsrf('/api/login', credentials);
    await api.get('/api/csrf-cookie');
    setUser(data.user);
    return data.user;
  };

  const register = async registration => {
    const { data } = await postWithFreshCsrf('/api/register', registration);
    await api.get('/api/csrf-cookie');
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await initializeCsrf();
    await api.post('/api/logout');
    setUser(null);
  };

  const resendVerification = async () => {
    const { data } = await postWithFreshCsrf('/api/email/verification-notification');
    return data;
  };

  const verifyEmail = async verificationPath => {
    const { data } = await api.get(verificationPath);
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
