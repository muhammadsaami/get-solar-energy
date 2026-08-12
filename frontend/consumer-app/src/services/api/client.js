// src/services/api/client.js
import axios from 'axios';
import { requestInterceptors, responseInterceptors } from './interceptors';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 45000, // Extend timeout for long-running Gemini API requests
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

api.interceptors.request.use(requestInterceptors.injectToken, requestInterceptors.onError);
api.interceptors.response.use(responseInterceptors.onSuccess, responseInterceptors.onError);

export default api;
