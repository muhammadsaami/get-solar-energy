import api from './api/client';

export const authService = {
  async signup(userData) {
    const res = await api.post('/signup', userData);
    return res.data;
  },
  async forgotPassword(email) {
    const res = await api.post('/forgot-password', { email });
    return res.data;
  },
  async resetPassword(token, newPassword) {
    const res = await api.post('/reset-password', { token, new_password: newPassword });
    return res.data;
  }
};
