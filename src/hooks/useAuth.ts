import { useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';

export const useTokenRefresh = () => {
  const { token, logout } = useAuth();

  const refreshToken = useCallback(async () => {
    try {
      if (!token) return false;
      
      await api.refresh();
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  }, [token, logout]);

  // Auto-refresh token before it expires (every 14 minutes for 15-minute tokens)
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      refreshToken();
    }, 14 * 60 * 1000); // 14 minutes

    return () => clearInterval(interval);
  }, [token, refreshToken]);

  return { refreshToken };
};

export const useAuthGuard = () => {
  const { isAuthenticated, isLoading } = useAuth();

  return {
    isAuthenticated,
    isLoading,
    canAccess: (requireAuth: boolean = true) => {
      if (!requireAuth) return true;
      return isAuthenticated;
    }
  };
};