import React, { createContext, useContext, useEffect, useState } from 'react';
import { IUser, Business } from '../types';
import { api } from '../api';

interface AuthContextType {
  user: IUser | null;
  business: Business | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  registerBusiness: (data: any) => Promise<void>;
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
  const [user, setUser] = useState<IUser | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('auth-token');
        const storedUser = localStorage.getItem('auth-user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Verify token is still valid by calling /me endpoint
          try {
            const response = await api.verifyToken();
            setUser(response.user as unknown as IUser);
          } catch (error) {
            // Token is invalid, clear auth state
            localStorage.removeItem('auth-token');
            localStorage.removeItem('auth-user');
            setToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.login(email, password);
      
      setUser(response.user as unknown as IUser);
      setToken(response.token);
      
      localStorage.setItem('auth-token', response.token);
      localStorage.setItem('auth-user', JSON.stringify(response.user));
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.register(name, email, password);
      
      setUser(response.user as unknown as IUser);
      setToken(response.token);
      
      localStorage.setItem('auth-token', response.token);
      localStorage.setItem('auth-user', JSON.stringify(response.user));
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerBusiness = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await api.registerBusiness(data);
      
      setUser(response.user as unknown as IUser);
      setBusiness(response.business);
      setToken(response.token);
      
      localStorage.setItem('auth-token', response.token);
      localStorage.setItem('auth-user', JSON.stringify(response.user));
      localStorage.setItem('auth-business', JSON.stringify(response.business));
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Call logout endpoint if token exists
      if (token) {
        await api.logout();
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear local state regardless of API call result
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth-token');
      localStorage.removeItem('auth-user');
      localStorage.removeItem('auth-business');
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    business,
    token,
    login,
    register,
    registerBusiness,
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