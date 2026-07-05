// src/services/proposal.service.js
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
  async approve() {
    localProposal = new ProposalModel({
      ...localProposal,
      status: 'Approved'
    });
    return Promise.resolve(true);
  }
};
