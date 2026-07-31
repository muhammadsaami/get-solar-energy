import React, { createContext, useState, useEffect, useCallback, useContext, useRef } from 'react';
import api from '../services/api/client';
import { authService } from '../services/auth.service';
import { logAuthEvent, AUTH_EVENTS } from '../utils/auditLogger';
import { normalizeAuthenticatedUser } from '../utils/auth';

const AuthContext = createContext(null);

function safeLocalStorageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionFlash, setSessionFlash] = useState(null);

  // Refs to compare session identity in storage handler (avoids stale closure)
  const liveIdentity = useRef({ token: null, user: null });

  // Keep liveIdentity current whenever token or user changes
  useEffect(() => {
    liveIdentity.current = { token, user };
  }, [token, user]);

  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    } catch {
      /* ignore storage errors */
    }
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setSessionFlash(null);
  }, []);

  function isTokenExpired(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  // Reload session from localStorage — used by storage event listener for cross-tab sync
  const reloadSession = useCallback(() => {
    const savedToken = safeLocalStorageGet('access_token');
    const savedUser = safeLocalStorageGet('user');

    if (!savedToken || !savedUser) {
      if (liveIdentity.current.token) {
        clearSession();
      }
      return;
    }

    if (isTokenExpired(savedToken)) {
      clearSession();
      logAuthEvent(AUTH_EVENTS.SESSION_EXPIRED);
      return;
    }

    try {
      const parsed = normalizeAuthenticatedUser(JSON.parse(savedUser));
      const current = liveIdentity.current;
      const identityChanged =
        current.token !== savedToken ||
        current.user?.email !== parsed.email ||
        current.user?.role !== parsed.role;

      if (identityChanged) {
        setToken(savedToken);
        setUser(parsed);
        setIsAuthenticated(true);
        setSessionFlash({
          message: 'Your session changed in another tab. Refreshing...',
          id: Date.now(),
        });
        logAuthEvent(AUTH_EVENTS.SESSION_RESTORED, { role: parsed.role, source: 'cross-tab' });
      }
    } catch {
      clearSession();
    }
  }, [clearSession]);

  useEffect(() => {
    const savedToken = safeLocalStorageGet('access_token');
    const savedUser = safeLocalStorageGet('user');
    if (savedToken && savedUser && !isTokenExpired(savedToken)) {
      try {
        const parsed = normalizeAuthenticatedUser(JSON.parse(savedUser));
        setToken(savedToken);
        setUser(parsed);
        setIsAuthenticated(true);
        logAuthEvent(AUTH_EVENTS.SESSION_RESTORED, { role: parsed.role });
      } catch {
        clearSession();
      }
    } else if (savedToken && isTokenExpired(savedToken)) {
      clearSession();
      logAuthEvent(AUTH_EVENTS.SESSION_EXPIRED);
    }
    setLoading(false);
  }, [clearSession]);

  // Auto-dismiss session flash after 4 seconds
  useEffect(() => {
    if (!sessionFlash) return;
    const timer = setTimeout(() => setSessionFlash(null), 4000);
    return () => clearTimeout(timer);
  }, [sessionFlash]);

  // Cross-tab storage event listener
  useEffect(() => {
    function handleStorageChange(e) {
      if (e.key === 'access_token') {
        if (!e.newValue) {
          // Token removed — logout
          clearSession();
        } else {
          // Token written or changed — could be login, different user, or token refresh
          reloadSession();
        }
      } else if (e.key === 'user') {
        // User data changed — reload session and compare identity
        reloadSession();
      }
    }
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [clearSession, reloadSession]);

  const persistSession = useCallback((token, rawUser) => {
    const normalized = normalizeAuthenticatedUser(rawUser);
    try {
      localStorage.setItem('access_token', token);
      localStorage.setItem('user', JSON.stringify(normalized));
    } catch {
      /* storage full or blocked */
    }
    setToken(token);
    setUser(normalized);
    setIsAuthenticated(true);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/login', { email, password });
      if (res.data.success) {
        persistSession(res.data.token, res.data);
        logAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, { email, role: 'customer' });
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (err) {
      const message = err.raw?.detail || err.message || 'Login failed';
      logAuthEvent(AUTH_EVENTS.LOGIN_FAILURE, { email, error: message });
      return { success: false, error: message };
    }
  };

  const technicianLogin = async (email, password) => {
    try {
      const res = await authService.technicianLogin(email, password);
      if (res.success) {
        persistSession(res.token, { ...res.technician, role: 'technician' });
        logAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, { email, role: 'technician' });
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (err) {
      const message = err.raw?.detail || err.message || 'Login failed';
      logAuthEvent(AUTH_EVENTS.LOGIN_FAILURE, { email, error: message });
      return { success: false, error: message };
    }
  };

  const technicianSignup = async (userData) => {
    try {
      const res = await authService.technicianSignup(userData);
      if (res.success) {
        persistSession(res.token, { ...res.technician, role: 'technician' });
        logAuthEvent(AUTH_EVENTS.SIGNUP_SUCCESS, { email: userData.email, role: 'technician' });
        return { success: true };
      }
      return { success: false, error: 'Signup failed' };
    } catch (err) {
      const message = err.raw?.detail || err.message || 'Signup failed';
      logAuthEvent(AUTH_EVENTS.SIGNUP_FAILURE, { email: userData.email, error: message });
      return { success: false, error: message };
    }
  };

  const logout = useCallback(() => {
    if (user?.email) {
      logAuthEvent(AUTH_EVENTS.LOGOUT, { email: user.email });
    }
    clearSession();
  }, [clearSession, user]);

  const setSession = (token, rawUser) => {
    persistSession(token, rawUser);
  };

  const value = {
    isAuthenticated,
    token,
    user,
    loading,
    sessionFlash,
    login,
    technicianLogin,
    technicianSignup,
    logout,
    setSession,
    dismissSessionFlash: () => setSessionFlash(null),
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
