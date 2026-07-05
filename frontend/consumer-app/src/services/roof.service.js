// src/services/roof.service.js
import api from './api/client';
import { RoofModel } from '../models/RoofModel';

let localRoofAnalysis = null;

export const roofService = {
  async getRoofAnalysis() {
    return Promise.resolve(localRoofAnalysis);
  },
  async analyze(image, lengthFt, widthFt, city, signal) {
    const formData = new FormData();
    formData.append('image', image);
    formData.append('length_ft', lengthFt);
    formData.append('width_ft', widthFt);
    formData.append('city', city);

    const res = await api.post('/analyze-roof', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      signal
    });

    const mapped = new RoofModel(res.data.data);
    localRoofAnalysis = mapped;
    return mapped;
  }
};
