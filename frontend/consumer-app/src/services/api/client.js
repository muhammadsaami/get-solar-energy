// src/services/api/client.js
import axios from 'axios';
import { requestInterceptors, responseInterceptors } from './interceptors';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  timeout: 45000, // Extend timeout for long-running Gemini API requests
  headers: {
    'Content-Type': 'application/json',
  }
});

api.interceptors.request.use(requestInterceptors.injectToken, requestInterceptors.onError);
api.interceptors.response.use(responseInterceptors.onSuccess, responseInterceptors.onError);

export default api;
