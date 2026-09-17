import api from './api/client';
import { ProposalModel } from '../models/ProposalModel';

let localProposal = new ProposalModel({
  proposal_id: "prop_102",
  status: "Ready",
  system_size_kw: 5.8,
  expected_generation_kwh_yr: 8700,
  financials: {
    monthly_savings: 4800,
    annual_savings: 57600,
    lifetime_savings_25yr: 1440000,
    payback_years: 4.5,
    subsidy_amount: 78000
  },
  equipment: [
    { type: "Solar Panels", spec: "450Wp Mono PERC Tier 1", quantity: 13 },
    { type: "Inverter", spec: "5kW String Inverter with Monitoring", quantity: 1 }
  ]
});

export const proposalService = {
  async getProposal() {
    return Promise.resolve(localProposal);
  },

  async generateProposal(formData = {}) {
    const res = await api.post('/generate-proposal', {
      customer_name: formData.customerName || 'Solar Customer',
      customer_address: formData.address || 'Residential Site',
      city: formData.city || 'Jaipur',
      monthly_units: parseFloat(formData.monthlyUnits) || 300,
      monthly_bill_rs: parseFloat(formData.monthlyBill) || 2400,
      per_unit_rate: parseFloat(formData.electricityRate) || 8,
      recommended_kw: parseFloat(formData.recommendedKw) || 3.0,
      roof_area_sqft: parseFloat(formData.roofArea) || 300,
      vendor_name: formData.vendorName || 'Get Solar Energy',
    });
    if (!res.data?.success) throw new Error(res.data?.error || 'Proposal generation failed');
    const model = new ProposalModel(res.data.data);
    localProposal = model;
    return model;
  },

  async approve() {
    localProposal = new ProposalModel({
      ...localProposal,
      status: 'Approved'
    });
    return Promise.resolve(true);
  }
};
