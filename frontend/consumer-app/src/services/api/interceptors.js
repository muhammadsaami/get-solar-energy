// src/services/api/interceptors.js
import axios from 'axios';
import { authManager } from './authManager';
import { errorHandler } from './errorHandler';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

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
  async onError(error) {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await authManager.refreshToken();
        isRefreshing = false;
        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);
        authManager.logout();
        return Promise.reject(errorHandler.normalize(refreshError));
      }
    }
    return Promise.reject(errorHandler.normalize(error));
  }
};
