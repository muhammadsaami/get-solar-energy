export class ProposalModel {
  constructor(raw) {
    this.id = raw.proposal_id || raw.id || 'prop_' + Date.now();
    this.status = raw.status || 'Ready';

    this.customerName = raw.customer_name || '';
    this.vendorName = raw.vendor_name || '';

    this.systemSizeKw = raw.system_size_kw || raw.recommended_kw || 5.8;
    this.expectedGenerationYrHkwh = raw.expected_generation_kwh_yr || raw.monthly_generation_units * 12 || 8700;

    this.monthlySavings = raw.monthly_savings_rs || raw.financials?.monthly_savings || 4800;
    this.annualSavings = raw.annual_savings_rs || raw.financials?.annual_savings || 57600;
    this.lifetimeSavings = raw.savings_25_years_rs || raw.financials?.lifetime_savings_25yr || 1440000;
    this.paybackYears = raw.payback_years || raw.financials?.payback_years || 4.5;
    this.subsidyAmount = raw.subsidy_rs || raw.financials?.subsidy_amount || 78000;
    this.systemCost = raw.system_cost_rs || raw.financials?.system_cost || raw.recommended_kw * 50000 || 290000;
    this.netCost = raw.net_cost_rs || this.systemCost - this.subsidyAmount;
    this.monthlyGenerationUnits = raw.monthly_generation_units || Math.round(this.systemSizeKw * 4.5 * 30);
    this.co2OffsetTons = raw.co2_offset_tons_per_year || parseFloat((this.expectedGenerationYrHkwh * 0.0008).toFixed(2));
    this.panelsRequired = raw.panels_required || Math.ceil(this.systemSizeKw * 1000 / 540);

    this.executiveSummary = raw.executive_summary || '';
    this.systemOverview = raw.system_overview || '';
    this.financialHighlights = raw.financial_highlights || '';
    this.whyChooseUs = raw.why_choose_us || '';
    this.termsAndConditions = raw.terms_and_conditions || [];

    this.equipment = (raw.equipment || [
      { type: "Solar Panels", spec: `${this.panelsRequired || 13} × 540Wp Mono PERC Tier 1`, quantity: this.panelsRequired || 13 },
      { type: "Inverter", spec: `${this.systemSizeKw}kW String Inverter with Monitoring`, quantity: 1 },
    ]).map(eq => ({
      type: eq.type || '',
      spec: eq.spec || '',
      quantity: eq.quantity || 0
    }));
  }
}
