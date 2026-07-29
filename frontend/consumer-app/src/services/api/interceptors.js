// src/services/api/interceptors.js
import { authManager } from './authManager';
import { errorHandler } from './errorHandler';

function isTokenExpired() {
  const token = authManager.getAccessToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return false;
  }
}

export const requestInterceptors = {
  injectToken(config) {
    if (isTokenExpired()) {
      authManager.logout();
      return Promise.reject(new Error('Session expired'));
    }
    const token = authManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    if (error.response?.status === 401 && authManager.getAccessToken()) {
      authManager.logout();
    }
    return Promise.reject(errorHandler.normalize(error));
  }
};
