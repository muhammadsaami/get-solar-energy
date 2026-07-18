import api from './api/client';

export const authService = {
  async login(username, password) {
    // Delegates to contexts in mock stage, but prepares endpoint contract
    const res = await api.post('/auth/login', { username, password });
    return res.data;
  },
  async getProfile() {
    const res = await api.get('/auth/me');
    return res.data;
  },
  async signup(userData) {
    const res = await api.post('/api/signup', userData);
    return res.data;
  },
  async forgotPassword(email) {
    const res = await api.post('/api/forgot-password', { email });
    return res.data;
  },
  async resetPassword(token, newPassword) {
    const res = await api.post('/api/reset-password', { token, new_password: newPassword });
    return res.data;
  }
};
