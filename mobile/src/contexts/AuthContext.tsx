import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { TOKEN_KEY } from '../lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  phone: string;
  country: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: any) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (!token) {
          setLoading(false);
          return;
        }
        const res = await api.get('/auth/me');
        if (mounted) setUser(res.data);
      } catch {
        await AsyncStorage.removeItem(TOKEN_KEY);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    bootstrap();
    return () => { mounted = false; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    await AsyncStorage.setItem(TOKEN_KEY, res.data.access_token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (payload: any) => {
    const res = await api.post('/auth/register', payload);
    await AsyncStorage.setItem(TOKEN_KEY, res.data.access_token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    await AsyncStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
