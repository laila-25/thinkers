import { useCallback, useEffect, useMemo, useState } from 'react';
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

  const initializeCsrf = () => api.get('/sanctum/csrf-cookie');

  const login = async credentials => {
    await initializeCsrf();
    const { data } = await api.post('/api/login', credentials);
    setUser(data.user);
    return data.user;
  };

  const register = async registration => {
    await initializeCsrf();
    const { data } = await api.post('/api/register', registration);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await initializeCsrf();
    await api.post('/api/logout');
    setUser(null);
  };

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    refreshUser: fetchUser,
  }), [user, isLoading, fetchUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
