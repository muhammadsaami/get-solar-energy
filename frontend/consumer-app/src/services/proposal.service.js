import api from './api/client';
import { ProposalModel } from '../models/ProposalModel';

// Release safety: there is no stored/cached proposal. A fresh customer has
// no proposal until /generate-proposal returns a real backend result.
// Never seed or return fabricated proposal data here.
let localProposal = null;

export const proposalService = {
  async getProposal() {
    return Promise.resolve(localProposal);
  },

  async generateProposal(formData = {}) {
    const monthlyBill = parseFloat(formData.monthlyBill);
    const monthlyUnits = parseFloat(formData.monthlyUnits);
    const recommendedKw = parseFloat(formData.recommendedKw);
    if (!(monthlyBill > 0) || !(monthlyUnits > 0) || !(recommendedKw > 0)) {
      throw new Error('Please enter your monthly bill, peak consumption, and recommended capacity before generating a proposal.');
    }
    const res = await api.post('/generate-proposal', {
      customer_name: formData.customerName || '',
      customer_address: formData.address || '',
      city: formData.city || '',
      monthly_units: monthlyUnits,
      monthly_bill_rs: monthlyBill,
      per_unit_rate: parseFloat(formData.electricityRate) || 8,
      recommended_kw: recommendedKw,
      roof_area_sqft: parseFloat(formData.roofArea) || 0,
      vendor_name: formData.vendorName || 'Get Solar Energy',
    });
    if (!res.data?.success) throw new Error(res.data?.error || 'Proposal generation failed');
    const model = new ProposalModel(res.data.data);
    localProposal = model;
    return model;
  },

  async approve() {
    if (!localProposal) return Promise.resolve(false);
    localProposal = new ProposalModel({
      ...localProposal,
      status: 'Approved'
    });
    return Promise.resolve(true);
  }
};
