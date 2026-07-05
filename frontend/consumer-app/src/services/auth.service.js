import api from './api';

export const authService = {
  async login(username, password) {
    // Delegates to contexts in mock stage, but prepares endpoint contract
    const res = await api.post('/auth/login', { username, password });
    return res.data;
  },
  async getProfile() {
    const res = await api.get('/auth/me');
    return res.data;
  }
};
