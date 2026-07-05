// src/services/bill.service.js
import api from './api/client';
import { BillModel } from '../models/BillModel';

let localBills = [
  new BillModel({
    id: "bill_01",
    upload_date: "2026-06-30T10:00:00Z",
    billing_period: "May 2026",
    provider: "Tata Power Delhi Distribution Limited",
    file_type: "pdf",
    ocr_status: "Completed",
    verification_status: "Verified",
    monthly_units: 580,
    bill_amount: 4930.00,
    confidence_score: 0.98,
    consumer_number: "100293121",
    sanctioned_load_kw: 8.0,
    average_cost_per_kwh: 8.50
  })
];

export const billService = {
  async getBills() {
    return Promise.resolve([...localBills]);
  },
  async upload(file, signal) {
    const formData = new FormData();
    formData.append('image', file);

    const res = await api.post('/analyze-bill', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      signal
    });

    const mapped = new BillModel(res.data.data);
    localBills = [mapped, ...localBills];
    return mapped;
  },
  async deleteBill(id) {
    localBills = localBills.filter(b => b.id !== id);
    return Promise.resolve(true);
  }
};
