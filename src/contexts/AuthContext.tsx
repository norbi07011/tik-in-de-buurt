import React, { createContext, useContext, useEffect, useState } from 'react';
import { Business } from '../types';
import { User } from '../types/user';
import { normalizeUser } from '../utils/normalize';
import { api } from '../api';
import tokenHelper from '../utils/token';

const BUILDID = 'AU-2025-10-02-UNFREEZE-V2';
console.log('[BUILDID]', BUILDID, 'AuthContext.tsx');

interface AuthContextType {
  user: User | null;
  business: Business | null;
  token?: string; // unified token property
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  registerBusiness: (data: any) => Promise<void>;
  requestPasswordReset?: (email: string) => Promise<void>; // stub for safety
  resetPassword?: (token: string, newPassword: string) => Promise<void>; // stub
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = tokenHelper.getToken();
        const storedUser = localStorage.getItem('auth-user');
        const storedBusiness = localStorage.getItem('auth-business');

        const parsedUser = storedUser ? JSON.parse(storedUser) : null;

        console.log('[AUTH_RESTORE]', {
          hasToken: !!storedToken,
          hasUser: !!storedUser,
          hasBusiness: !!storedBusiness,
          userBusinessId: !!parsedUser?.businessId
        });

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(parsedUser);
          
          if (storedBusiness) {
            try {
              setBusiness(JSON.parse(storedBusiness));
              console.log('[AUTH_RESTORE] ✅ Restored: token + user + business');
            } catch (e) {
              console.error('[AUTH_RESTORE] ❌ Failed to parse stored business:', e);
              console.log('[AUTH_RESTORE] ✅ Restored: token + user only');
            }
          } else if (parsedUser?.businessId) {
            // FALLBACK KRYTYCZNY: synthetic business object
            const synthetic = {
              id: parsedUser.businessId,
              name: parsedUser.businessName ?? 'My Business',
              status: 'synthetic'
            };
            setBusiness(synthetic as any);
            localStorage.setItem('auth-business', JSON.stringify(synthetic));
            console.warn('[AUTH_RESTORE] No auth-business; synthesized from user.businessId:', synthetic);
          } else {
            console.log('[AUTH_RESTORE] ✅ Restored: token + user, no business');
          }
        }
      } catch (error) {
        console.error('[AUTH_RESTORE] ❌ Failed to restore auth state:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      console.log('[AUTH_LOGIN] Attempting login:', email);
      const response = await api.login(email, password);
      
      // Store auth data
      const normalizedUser = normalizeUser(response.user);
      
      setUser(normalizedUser);
      setToken(response.token);
      tokenHelper.setToken(response.token);
      localStorage.setItem('auth-token', response.token);
      localStorage.setItem('auth-user', JSON.stringify(normalizedUser));
      
      console.log('[AUTH_LOGIN] ✅ Token saved (first 20):', response.token.substring(0, 20) + '...');
      console.log('[AUTH_LOGIN] ✅ User saved');
      console.log('[AUTH_LOGIN] ✅ Login successful');
    } catch (error) {
      console.error('[AUTH_LOGIN] ❌ Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      console.log('📝 Attempting registration:', email);
      const response = await api.register(name, email, password);
      
      // Store auth data  
      setUser(normalizeUser(response.user));
      setToken(response.token);
      tokenHelper.setToken(response.token);
      localStorage.setItem('auth-user', JSON.stringify(normalizeUser(response.user)));
      
      console.log('✅ Registration successful');
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerBusiness = async (data: any): Promise<void> => {
    setIsLoading(true);
    try {
      console.log('🏢 [AUTH] Attempting business registration:', data.email);
      console.log('🏢 [AUTH] Calling api.registerBusiness...');
      
      const response = await api.registerBusiness(data);
      
      console.log('✅ [AUTH] API response received:', {
        hasUser: !!response.user,
        hasToken: !!response.token,
        hasBusiness: !!response.business,
        userId: response.user?._id || response.user?.id
      });
      
      // Defensive null/undefined checks
      if (!response || !response.user || !response.token) {
        console.error('🔴🔴🔴 [AUTH] Invalid response structure:', response);
        throw new Error('Invalid response from server: missing user or token');
      }
      
      // Store auth data with defensive checks
      let normalizedUser = normalizeUser(response.user);
      
      // 3) Spójność user.businessId - jeśli brakuje w user, ale jest w business.id
      if (!normalizedUser.businessId && response.business?.id) {
        console.log('🔧 [AUTH] Fixing missing businessId: setting from business.id:', response.business.id);
        normalizedUser = {
          ...normalizedUser,
          businessId: String(response.business.id)
        };
      }
      
      console.log('✅ [AUTH] Normalized user with businessId:', {
        userId: normalizedUser._id || normalizedUser.id,
        businessId: normalizedUser.businessId
      });
      
      setUser(normalizedUser);
      setToken(response.token);
      tokenHelper.setToken(response.token);
      
      // Store all auth data
      localStorage.setItem('auth-token', response.token);
      localStorage.setItem('auth-user', JSON.stringify(normalizedUser));
      console.log('✅ [AUTH] Token saved (first 20 chars):', response.token.substring(0, 20) + '...');
      console.log('✅ [AUTH] User saved to localStorage:', JSON.stringify(normalizedUser).substring(0, 100) + '...');
      
      // Store business if available
      if (response.business) {
        setBusiness(response.business);
        localStorage.setItem('auth-business', JSON.stringify(response.business));
        console.log('✅ [AUTH] Business saved to localStorage:', JSON.stringify(response.business).substring(0, 100) + '...');
      } else {
        console.warn('⚠️ [AUTH] No business data in response');
      }
      
      console.log('✅ [AUTH] Business registration successful - auth state updated');
    } catch (error) {
      console.error('❌ [AUTH] Business registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('🚪 Logging out');
    setUser(null);
    setBusiness(null);
    setToken(null);
    tokenHelper.clearToken();
    localStorage.removeItem('auth-user');
    localStorage.removeItem('auth-business');
  };

  // Stub methods for compatibility
  const requestPasswordReset = async (email: string): Promise<void> => {
    console.log('🔄 Password reset requested for:', email);
    // TODO: Implement when needed
  };

  const resetPassword = async (resetToken: string, newPassword: string): Promise<void> => {
    console.log('🔑 Password reset attempted');
    // TODO: Implement when needed
  };

  const value: AuthContextType = {
    user,
    business,
    token: token || undefined,
    login,
    register,
    registerBusiness,
    requestPasswordReset,
    resetPassword,
    logout,
    isLoading,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};