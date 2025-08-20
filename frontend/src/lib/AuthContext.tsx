import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { authService, User } from './auth';
import { apiUtils } from './api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (apiUtils.isAuthenticated()) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          setIsAuthenticated(!!currentUser);
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const userData = await authService.login({ email, password });
      
      // Fix: Add null check before accessing userData properties
      if (userData) {
        setUser(userData.user);
        setIsAuthenticated(true);
        console.log('✅ Auth context updated with user:', userData.user.name);
      } else {
        throw new Error('Login failed - no user data returned');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
      console.error('❌ Login error in AuthContext:', err);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};