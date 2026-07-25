// src/services/api/interceptors.js
import { authManager } from './authManager';
import { errorHandler } from './errorHandler';

export const requestInterceptors = {
  injectToken(config) {
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
    return Promise.reject(errorHandler.normalize(error));
  }
};
