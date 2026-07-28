import api from './api/client';

export const siteSurveyService = {
  async getDashboard() {
    const res = await api.get('/site-surveys/dashboard');
    return res.data?.data || {};
  },

  async listSurveys(params = {}) {
    const res = await api.get('/site-surveys', { params });
    return { data: res.data?.data || [], pagination: res.data?.pagination || {} };
  },

  async getSurvey(id) {
    const res = await api.get(`/site-surveys/${id}`);
    return res.data?.data || null;
  },

  async createSurvey(data) {
    const res = await api.post('/site-surveys', data);
    return res.data?.data || null;
  },

  async updateSurvey(id, data) {
    const res = await api.put(`/site-surveys/${id}`, data);
    return res.data?.data || null;
  },

  async updateStatus(id, status) {
    const res = await api.patch(`/site-surveys/${id}/status`, { status });
    return res.data?.data || null;
  },

  async assignSurveyor(id, assignedTo, assignedName) {
    const res = await api.patch(`/site-surveys/${id}/assign`, { assigned_to: assignedTo, assigned_name: assignedName });
    return res.data?.data || null;
  },

  async deleteSurvey(id) {
    const res = await api.delete(`/site-surveys/${id}`);
    return res.data?.success || false;
  },

  async runAiFeasibility(data) {
    const res = await api.post('/site-survey', data);
    return res.data;
  },

  async getPhotos(surveyId) {
    const res = await api.get(`/site-surveys/${surveyId}/photos`);
    return res.data?.data || [];
  },

  async addPhoto(surveyId, data) {
    const res = await api.post(`/site-surveys/${surveyId}/photos`, data);
    return res.data?.data || null;
  },

  async deletePhoto(photoId) {
    const res = await api.delete(`/site-surveys/photos/${photoId}`);
    return res.data?.success || false;
  },

  async updateChecklist(surveyId, checklist) {
    const res = await api.put(`/site-surveys/${surveyId}/checklist`, { checklist });
    return res.data?.data || null;
  },

  async getProposalPrefill(surveyId) {
    const res = await api.get(`/site-surveys/${surveyId}/proposal-prefill`);
    return res.data?.data || null;
  },

  async handoffInstallation(surveyId) {
    const res = await api.post(`/site-surveys/${surveyId}/handoff-installation`);
    return res.data?.success ? res.data?.data : null;
  },
};
