// src/services/api/interceptors.js
// Infrastructure only: attach tokens, detect auth failures. No business logic.
import { tokenManager } from '../auth/tokenManager';
import { authEvents, AuthEventTypes } from '../auth/authEvents';
import { errorHandler } from './errorHandler';

export const requestInterceptors = {
  injectToken(config) {
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
    return config;
  },
  onError(error) {
    return Promise.reject(error);
  }
};

export const responseInterceptors = {
  onSuccess(response) {
    return response;
  },
  onError(error) {
    const url = error.config?.url || '';
    const isAuthEndpoint = url.includes('/auth/refresh') || url.includes('/refresh') || url.includes('/auth/login') || url.includes('/login') || url.includes('/technician/login');

    if (error.response?.status === 401 && tokenManager.getAccessToken() && !isAuthEndpoint) {
      // Notify the session layer — it owns the decision (refresh vs logout).
      authEvents.emit(AuthEventTypes.UNAUTHORIZED, { reason: 'http-401' });
    }
    return Promise.reject(errorHandler.normalize(error));
  }
};
