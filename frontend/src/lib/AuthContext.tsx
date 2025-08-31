import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { apiUtils, getErrorMessage } from './api';

type User = {
  id: number;
  name?: string;
  email?: string;
  is_admin?: boolean;
  isAdmin?: boolean;
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, force?: boolean) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  validateSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = sessionStorage.getItem('auth_user');
      return stored ? JSON.parse(stored) as User : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const authToken = sessionStorage.getItem('token') || sessionStorage.getItem('authToken');
    const sessionToken = sessionStorage.getItem('sessionToken');
    return !!(authToken && sessionToken);
  });

  const validateSession = async (): Promise<boolean> => {
    const authToken = sessionStorage.getItem('token') || sessionStorage.getItem('authToken');
    const sessionToken = sessionStorage.getItem('sessionToken');
    
    if (!authToken || !sessionToken) {
      setUser(null);
      setIsAuthenticated(false);
      return false;
    }
  
    try {
      const response = await fetch('/api/auth/validate-session', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.user) {
          if (!user || user.id !== result.user.id) {
            setUser(result.user as User);
            sessionStorage.setItem('auth_user', JSON.stringify(result.user));
          }
          setIsAuthenticated(true);
          return true;
        }
        // invalid according to server
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('sessionToken');
        sessionStorage.removeItem('auth_user');
        setUser(null);
        setIsAuthenticated(false);
        return false;
      } else {
        // HTTP error (401/403 etc.)
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('sessionToken');
        sessionStorage.removeItem('auth_user');
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }
    } catch (error) {
      console.error('Session validation network error:', error);
      // keep existing tokens on network error
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const authToken = sessionStorage.getItem('token') || sessionStorage.getItem('authToken');
        const sessionToken = sessionStorage.getItem('sessionToken');
        
        if (authToken && sessionToken) {
          const isValidSession = await validateSession();
          if (!isValidSession) {
            setUser(null);
            setIsAuthenticated(false);
          }
        } else if (authToken && !sessionToken) {
          // cleanup legacy state
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('authToken');
          sessionStorage.removeItem('auth_user');
          setUser(null);
          setIsAuthenticated(false);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // login now supports force parameter (calls /auth/login or /auth/login/force)
  const login = async (email: string, password: string, force = false): Promise<User> => {
    setError(null);
    setLoading(true);

    try {
      const normalizedEmail = String(email).trim().toLowerCase();
      const endpoint = force ? '/api/auth/login/force' : '/api/auth/login';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password })
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 409) {
        // Session conflict — caller (LoginPage) will handle showing Force option.
        const err = new Error(result.message || 'Account already logged in elsewhere');
        (err as any).status = 409;
        setLoading(false);
        throw err;
      }

      if (!response.ok || !result.success) {
        const msg = result.message || 'Authentication failed';
        setError(msg);
        setLoading(false);
        throw new Error(msg);
      }

      const token = result.token;
      const sessionToken = result.sessionToken;
      const userPayload = result.user;

      if (!token || !userPayload) {
        const msg = result.message || 'Invalid response from server';
        setError(msg);
        setLoading(false);
        throw new Error(msg);
      }

      // Use sessionStorage (per-tab) — this prevents cross-tab token sharing
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('authToken', token);
      if (sessionToken) sessionStorage.setItem('sessionToken', sessionToken);
      sessionStorage.setItem('auth_user', JSON.stringify(userPayload));

      // Persist via apiUtils if you need (update apiUtils to use sessionStorage if required)
      try { apiUtils.setAuthToken(token); apiUtils.setUserData(userPayload); } catch (e) { /* ignore */ }

      setUser(userPayload as User);
      setIsAuthenticated(true);
      setLoading(false);
      return userPayload as User;

    } catch (err: any) {
      const msg = getErrorMessage(err);
      setError(msg);
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    try {
      const authToken = sessionStorage.getItem('token') || sessionStorage.getItem('authToken');
      if (authToken) {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }
          });
        } catch (err) {
          console.warn('Logout API failed, proceeding to clear local session');
        }
      }

      try { apiUtils.removeAuthToken(); } catch { /* ignore */ }

    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('sessionToken');
      sessionStorage.removeItem('auth_user');

      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      logout,
      isAuthenticated,
      validateSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};