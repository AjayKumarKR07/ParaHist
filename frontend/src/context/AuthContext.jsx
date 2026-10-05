// AuthContext.jsx — Client-side Authentication State Management
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const TOKEN_KEY = 'parahist_token';
export const USER_KEY  = 'parahist_user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(TOKEN_KEY) || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Initialize and verify authentication state on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else {
        setToken(null);
        setUser(null);
      }
    } catch (e) {
      console.warn('Failed to restore auth session:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Login handler
  const login = useCallback(async (email, password) => {
    const res = await api.login({ email, password });
    if (res && res.success && res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    }
    return res;
  }, []);

  // Register handler
  const register = useCallback(async (name, email, password) => {
    return await api.register({ name, email, password });
  }, []);

  // Update user state handler (used after profile/preferences edits)
  const updateUser = useCallback((updatedUserData) => {
    if (!updatedUserData) return;
    setUser(prev => {
      const merged = { ...prev, ...updatedUserData };
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(merged));
      } catch (e) {
        console.warn('Failed to persist user updates:', e);
      }
      return merged;
    });
  }, []);

  // Refresh user data from backend
  const refreshUser = useCallback(async () => {
    try {
      const res = await api.getCurrentUser();
      if (res && res.success && res.user) {
        setUser(res.user);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        return res.user;
      }
    } catch (e) {
      console.warn('Failed to refresh user profile:', e);
    }
    return null;
  }, []);

  // Logout handler
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const isAuthenticated = Boolean(token && user);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
