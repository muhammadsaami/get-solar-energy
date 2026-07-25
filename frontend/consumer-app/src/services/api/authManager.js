// src/services/api/authManager.js

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
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/';
  },
};
