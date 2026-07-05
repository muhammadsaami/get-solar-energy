// src/models/ProposalModel.js

export class ProposalModel {
  constructor(raw) {
    this.id = raw.proposal_id || 'prop_102';
    this.status = raw.status || 'Ready';
    this.systemSizeKw = raw.system_size_kw || 5.8;
    this.expectedGenerationYrHkwh = raw.expected_generation_kwh_yr || 8700;
    
    this.monthlySavings = raw.financials?.monthly_savings || 4800;
    this.annualSavings = raw.financials?.annual_savings || 57600;
    this.lifetimeSavings = raw.financials?.lifetime_savings_25yr || 1440000;
    this.paybackYears = raw.financials?.payback_years || 4.5;
    this.subsidyAmount = raw.financials?.subsidy_amount || 78000;
    
    this.equipment = (raw.equipment || [
      { type: "Solar Panels", spec: "450Wp Mono PERC Tier 1", quantity: 13 },
      { type: "Inverter", spec: "5kW String Inverter with Monitoring", quantity: 1 }
    ]).map(eq => ({
      type: eq.type || '',
      spec: eq.spec || '',
      quantity: eq.quantity || 0
    }));
  }
}
