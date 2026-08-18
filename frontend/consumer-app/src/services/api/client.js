// src/services/api/client.js
import axios from 'axios';
import { requestInterceptors, responseInterceptors } from './interceptors';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 60000, // 60s timeout for complex AI multimodal analysis
  withCredentials: true,
});

api.interceptors.request.use(requestInterceptors.injectToken, requestInterceptors.onError);
api.interceptors.response.use(responseInterceptors.onSuccess, responseInterceptors.onError);

export default api;
