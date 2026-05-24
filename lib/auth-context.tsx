'use client';

import { AuthUser } from '@/lib/api/types';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { getMe, login as apiLogin, logout as apiLogout, register as apiRegister } from './api/http';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  register: (email: string, username: string, password: string, role: 'TEACHER' | 'STUDENT') => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    getMe().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);
  
  const login = useCallback(async (email: string, password: string) => {
    const u = await apiLogin(email, password);
    setUser(u);
    return u;
  }, []);
  
  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);
  
  const register = useCallback(
    async (email: string, username: string, password: string, role: 'TEACHER' | 'STUDENT') => {
      await apiRegister(email, username, password, role);
    },
    [],
  );
  
  return (
    <AuthContext value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
