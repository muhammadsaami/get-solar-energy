import api from './api';

export const journeyService = {
  async getStatus() {
    const res = await api.get('/journey/status');
    return res.data;
  },
  async getHistory() {
    const res = await api.get('/journey/history');
    return res.data;
  }
};
