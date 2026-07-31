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
  },

  async technicianLogin(email, password) {
    const res = await api.post('/technician/login', { email, password });
    return res.data;
  },
  async technicianSignup(userData) {
    const res = await api.post('/technician/signup', userData);
    return res.data;
  },
  async technicianGetProfile() {
    const res = await api.get('/technician/profile');
    return res.data;
  },
};
