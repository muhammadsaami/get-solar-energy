import React, { createContext, useState, useEffect, useCallback, useContext, useRef } from 'react';
import { authService } from '../services/auth/auth.service';
import { sessionManager } from '../services/auth/sessionManager';
import { authEvents, AuthEventTypes } from '../services/auth/authEvents';
import { AuthStateMachine, AuthLifecycleStates, AuthTransitionEvents } from '../services/auth/authStateMachine';
import { logAuthEvent, AUTH_EVENTS } from '../utils/auditLogger';
import { normalizeAuthenticatedUser } from '../utils/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionFlash, setSessionFlash] = useState(null);
  const [lifecycle, setLifecycle] = useState(AuthLifecycleStates.BOOTSTRAPPING);

  const machineRef = useRef(new AuthStateMachine());
  const liveIdentity = useRef({ token: null, user: null });

  const setLifecycleFromMachine = useCallback((state) => setLifecycle(state), []);

  useEffect(() => {
    const unsubscribe = machineRef.current.onTransition(setLifecycleFromMachine);
    return unsubscribe;
  }, [setLifecycleFromMachine]);

  useEffect(() => {
    liveIdentity.current = { token, user };
  }, [token, user]);

  const clearSession = useCallback(() => {
    sessionManager.clearSession();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setSessionFlash(null);
  }, []);

  const persistSession = useCallback((nextToken, rawUser, expiresIn = null) => {
    const normalized = normalizeAuthenticatedUser(rawUser);
    sessionManager.persistSession(nextToken, normalized, expiresIn);
    setToken(nextToken);
    setUser(normalized);
    setIsAuthenticated(true);
    machineRef.current.transition(AuthTransitionEvents.LOGIN);
  }, [machineRef]);

  // Reload session from storage — used for cross-tab sync.
  const reloadSession = useCallback(() => {
    const snapshot = sessionManager.bootstrap();

    if (snapshot.expired) {
      clearSession();
      logAuthEvent(AUTH_EVENTS.SESSION_EXPIRED);
      return;
    }

    if (!snapshot.token || !snapshot.user) {
      if (liveIdentity.current.token) {
        clearSession();
      }
      return;
    }

    const parsed = normalizeAuthenticatedUser(snapshot.user);
    const current = liveIdentity.current;
    const identityChanged =
      current.token !== snapshot.token ||
      current.user?.email !== parsed.email ||
      current.user?.role !== parsed.role;

    if (identityChanged) {
      setToken(snapshot.token);
      setUser(parsed);
      setIsAuthenticated(true);
      machineRef.current.transition(AuthTransitionEvents.RESTORE);
      setSessionFlash({
        message: 'Your session changed in another tab. Refreshing...',
        id: Date.now(),
      });
      logAuthEvent(AUTH_EVENTS.SESSION_RESTORED, { role: parsed.role, source: 'cross-tab' });
    }
  }, [clearSession, machineRef]);

  // Cross-tab session broadcast + interceptor-driven events.
  useEffect(() => {
    sessionManager.startBroadcast();

    const handleRemoteEvent = (event) => {
      if (event.origin !== 'remote') return;
      switch (event.type) {
        case AuthEventTypes.LOGOUT:
        case AuthEventTypes.FORCE_LOGOUT:
        case AuthEventTypes.SESSION_REVOKED:
          clearSession();
          break;
        case AuthEventTypes.SESSION_EXPIRED:
        case AuthEventTypes.PASSWORD_CHANGED:
          clearSession();
          break;
        case AuthEventTypes.SESSION_RESTORED:
          reloadSession();
          break;
        default:
          break;
      }
    };

    const unsubscribeRemote = sessionManager.subscribe(handleRemoteEvent);

    const handleUnauthorized = async () => {
      // Attempt single-flight refresh before giving up
      const refreshed = await sessionManager.refreshSession();
      if (refreshed) {
        const snapshot = sessionManager.bootstrap();
        if (snapshot.token && snapshot.user) {
          setToken(snapshot.token);
          setUser(normalizeAuthenticatedUser(snapshot.user));
          setIsAuthenticated(true);
          return;
        }
      }

      sessionManager.sessionExpired('http-401');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      machineRef.current.transition(AuthTransitionEvents.SESSION_EXPIRED);
      setSessionFlash({ message: 'Your session has expired. Please sign in again.', id: Date.now() });
    };

    const unsubscribeUnauthorized = authEvents.on(AuthEventTypes.UNAUTHORIZED, handleUnauthorized);

    return () => {
      unsubscribeRemote();
      unsubscribeUnauthorized();
      sessionManager.stopBroadcast();
    };
  }, [clearSession, reloadSession]);

  // Startup: restore persisted session or attempt HttpOnly cookie refresh
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      const snapshot = sessionManager.bootstrap();

      if (snapshot.token && snapshot.user && !snapshot.expired) {
        try {
          const parsed = normalizeAuthenticatedUser(snapshot.user);
          if (mounted) {
            setToken(snapshot.token);
            setUser(parsed);
            setIsAuthenticated(true);
            machineRef.current.transition(AuthTransitionEvents.RESTORE);
            logAuthEvent(AUTH_EVENTS.SESSION_RESTORED, { role: parsed.role });
          }
        } catch {
          sessionManager.clearSession();
        }
      } else {
        // Attempt HttpOnly cookie silent refresh on startup
        try {
          const refreshed = await sessionManager.refreshSession();
          if (refreshed) {
            const freshSnapshot = sessionManager.bootstrap();
            if (freshSnapshot.token) {
              try {
                const currentUserData = await authService.getCurrentUser();
                const resolvedUser = currentUserData?.user || currentUserData || freshSnapshot.user;
                if (resolvedUser && mounted) {
                  const parsed = normalizeAuthenticatedUser(resolvedUser);
                  sessionManager.persistSession(freshSnapshot.token, parsed);
                  setToken(freshSnapshot.token);
                  setUser(parsed);
                  setIsAuthenticated(true);
                  machineRef.current.transition(AuthTransitionEvents.RESTORE);
                  logAuthEvent(AUTH_EVENTS.SESSION_RESTORED, { role: parsed.role });
                }
              } catch {
                if (freshSnapshot.user && mounted) {
                  const parsed = normalizeAuthenticatedUser(freshSnapshot.user);
                  setToken(freshSnapshot.token);
                  setUser(parsed);
                  setIsAuthenticated(true);
                  machineRef.current.transition(AuthTransitionEvents.RESTORE);
                }
              }
            }
          } else if (snapshot.expired) {
            sessionManager.clearSession();
            logAuthEvent(AUTH_EVENTS.SESSION_EXPIRED);
          }
        } catch {
          sessionManager.clearSession();
        }
      }

      if (mounted) {
        machineRef.current.transition(AuthTransitionEvents.BOOTSTRAP_COMPLETE);
        setLoading(false);
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // Auto-dismiss session flash after 4 seconds.
  useEffect(() => {
    if (!sessionFlash) return;
    const timer = setTimeout(() => setSessionFlash(null), 4000);
    return () => clearTimeout(timer);
  }, [sessionFlash]);

  const login = async (email, password, roleHint, rememberMe) => {
    try {
      const data = await authService.login({ email, password, roleHint, rememberMe });

      const accessToken = data.access_token || data.token;
      if (accessToken) {
        const backendRole = data.user?.role || data.role || roleHint || 'customer';
        const userObj = data.user ? { ...data.user, role: backendRole } : { ...data, role: backendRole };
        persistSession(accessToken, userObj, data.expires_in || null);
        logAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, { email, role: backendRole });
        return { success: true, role: backendRole };
      }

      if (data?.success) {
        const backendRole = data.user?.role || data.role || roleHint || 'customer';
        const userObj = { ...data, role: backendRole };
        persistSession(data.token, userObj, data.expires_in || null);
        logAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, { email, role: backendRole });
        return { success: true, role: backendRole };
      }

      return { success: false, error: data?.message || 'Login failed' };
    } catch (err) {
      const message = err.raw?.detail || err.response?.data?.detail || err.message || 'Login failed';
      logAuthEvent(AUTH_EVENTS.LOGIN_FAILURE, { email, error: message });
      return { success: false, error: message };
    }
  };

  const technicianLogin = async (email, password, rememberMe) => {
    try {
      const data = await authService.technicianLogin({ email, password, rememberMe });

      const accessToken = data.access_token || data.token;
      if (accessToken) {
        const userRole = data.user?.role || data.role || 'technician';
        const techUser = data.user || data.technician || { name: 'Technician', role: userRole };
        persistSession(accessToken, { ...techUser, role: userRole }, data.expires_in || null);
        logAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, { email, role: userRole });
        return { success: true, role: userRole };
      }

      if (data?.success) {
        const userRole = data.user?.role || data.role || 'technician';
        const techUser = data.user || data.technician || { name: 'Technician', role: userRole };
        persistSession(data.token, { ...techUser, role: userRole }, data.expires_in || null);
        logAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, { email, role: userRole });
        return { success: true, role: userRole };
      }

      return { success: false, error: data?.message || 'Login failed' };
    } catch (err) {
      const message = err.raw?.detail || err.response?.data?.detail || err.message || 'Login failed';
      logAuthEvent(AUTH_EVENTS.LOGIN_FAILURE, { email, error: message });
      return { success: false, error: message };
    }
  };

  const technicianSignup = async (userData) => {
    try {
      const data = await authService.technicianSignup(userData);
      const accessToken = data.access_token || data.token;
      if (accessToken) {
        const techUser = data.user || data.technician || { name: userData.name, role: 'technician' };
        persistSession(accessToken, { ...techUser, role: 'technician' }, data.expires_in || null);
        logAuthEvent(AUTH_EVENTS.SIGNUP_SUCCESS, { email: userData.email, role: 'technician' });
        return { success: true };
      }
      if (data?.success) {
        persistSession(data.token, { ...data.technician, role: 'technician' }, data.expires_in || null);
        logAuthEvent(AUTH_EVENTS.SIGNUP_SUCCESS, { email: userData.email, role: 'technician' });
        return { success: true };
      }
      return { success: false, error: 'Signup failed' };
    } catch (err) {
      const message = err.raw?.detail || err.response?.data?.detail || err.message || 'Signup failed';
      logAuthEvent(AUTH_EVENTS.SIGNUP_FAILURE, { email: userData.email, error: message });
      return { success: false, error: message };
    }
  };

  const logout = useCallback(async () => {
    if (user?.email) {
      logAuthEvent(AUTH_EVENTS.LOGOUT, { email: user.email });
    }
    try {
      await authService.logout();
    } catch {
      // Ignore server communication errors on logout
    }
    machineRef.current.transition(AuthTransitionEvents.LOGOUT);
    sessionManager.logout('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setSessionFlash(null);
    machineRef.current.transition(AuthTransitionEvents.LOGOUT_COMPLETE);
  }, [user, machineRef]);

  const setSession = (nextToken, rawUser) => {
    persistSession(nextToken, rawUser);
  };

  const value = {
    isAuthenticated,
    token,
    user,
    loading,
    sessionFlash,
    lifecycle,
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
