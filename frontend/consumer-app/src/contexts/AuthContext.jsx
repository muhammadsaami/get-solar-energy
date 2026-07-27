import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api/client';
import { normalizeRole, getDisplayRole } from '../utils/role';

const AuthContext = createContext(null);

function normalizeUser(raw) {
  if (!raw) return null;
  const canonicalRole = normalizeRole(raw.role);
  return {
    ...raw,
    role: canonicalRole,
    displayRole: getDisplayRole(canonicalRole),
    subscriptionTier: raw.subscriptionTier || raw.subscription_tier || getDisplayRole(canonicalRole),
  };
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(normalizeUser(JSON.parse(savedUser)));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/login', { email, password });
      if (res.data.success) {
        const { token, user } = res.data;
        localStorage.setItem('access_token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setToken(token);
        setUser(normalizeUser(user));
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (err) {
      const detail = err.response?.data?.detail || 'Login failed';
      return { success: false, error: detail };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const setSession = (token, user) => {
    setToken(token);
    setUser(normalizeUser(user));
    setIsAuthenticated(true);
  };

  const value = {
    isAuthenticated,
    token,
    user,
    loading,
    login,
    logout,
    setSession
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
