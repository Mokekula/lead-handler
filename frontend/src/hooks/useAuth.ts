'use client';

import { useState } from 'react';
import { login as apiLogin, getToken, removeToken } from '@/lib/api';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return getToken() !== null;
  });

  const login = async (password: string): Promise<void> => {
    await apiLogin(password);
    setIsAuthenticated(true);
  };

  const logout = (): void => {
    removeToken();
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  return { isAuthenticated, login, logout };
}
