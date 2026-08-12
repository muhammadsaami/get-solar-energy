// src/services/bill.service.js
import api from './api/client';
import { BillModel } from '../models/BillModel';

let localSessionBills = [];

export const billService = {
  async getBills() {
    try {
      const res = await api.get('/dashboard/recent-bills');
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map(b => new BillModel(b));
      }
    } catch {
      // Backend not reached or bills table empty
    }
    return [...localSessionBills];
  },
  async upload(file, signal) {
    const formData = new FormData();
    formData.append('image', file);

    const res = await api.post('/analyze-bill', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      signal
    });

    const mapped = new BillModel(res.data.data);
    localSessionBills = [mapped, ...localSessionBills];
    return mapped;
  },
  async deleteBill(id) {
    localSessionBills = localSessionBills.filter(b => b.id !== id);
    return Promise.resolve(true);
  }
};

