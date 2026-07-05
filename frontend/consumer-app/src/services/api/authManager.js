// src/services/api/authManager.js
import axios from 'axios';

let inMemoryToken = null;

export const authManager = {
  getAccessToken() {
    return inMemoryToken || localStorage.getItem('access_token');
  },
  setAccessToken(token) {
    inMemoryToken = token;
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  },
  logout() {
    inMemoryToken = null;
    localStorage.clear();
    window.location.href = '/';
  },
  async refreshToken() {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) throw new Error("No refresh token active");
    
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
    const res = await axios.post(`${baseURL}/auth/refresh`, { refresh_token: refresh });
    const newToken = res.data.access_token;
    this.setAccessToken(newToken);
    return newToken;
  }
};
