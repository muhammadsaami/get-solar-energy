// src/models/BillModel.js

export class BillModel {
  constructor(raw) {
    this.id = raw.id || `bill_${Date.now()}`;
    this.uploadDate = raw.upload_date || new Date().toISOString();
    this.customerName = raw.customer_name || 'Valued Consumer';
    this.consumerNumber = raw.consumer_number || '';
    this.discom = raw.discom || '';
    this.billingPeriod = raw.billing_period || '';
    this.kwhConsumption = raw.monthly_units || 0;
    this.amount = raw.bill_amount || 0;
    this.perUnitRate = raw.per_unit_rate || 0.0;
    this.recommendedKw = raw.recommended_kw || 0.0;
    this.monthlyGeneration = raw.monthly_generation_units || 0;
    this.monthlySavings = raw.monthly_savings_rs || 0;
    this.systemCost = raw.system_cost_rs || 0;
    this.paybackYears = raw.payback_years || 0.0;
    this.savings25yr = raw.savings_25_years_rs || 0;

    // Timeline attributes driven from processing stages
    this.ocrStatus = raw.ocr_status || 'Completed';
    this.verificationStatus = raw.verification_status || 'Verified';
    this.sanctionedLoad = raw.sanctioned_load_kw || 8.0;
  }
}
